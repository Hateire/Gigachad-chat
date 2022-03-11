const SERVER_HOST = '0.0.0.0';
const HTTP_SERVER_PORT = "8081";

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { DEFAULT_AVATAR } from './server-env.js';
import { createServer } from "http";
import { WebSocketServer } from 'ws';

const messageData = existsSync('messageDB.txt') ? JSON.parse(readFileSync('messageDB.txt')) : [];
const authData = existsSync('authDB.txt') ? JSON.parse(readFileSync('authDB.txt')) : {};
const avatarData = existsSync('avatarDB.txt') ? JSON.parse(readFileSync('avatarDB.txt')) : {};


const server = createServer((req, res) => {
  CORS(res);
  switch(req.method) {
    case "OPTIONS":
      res.writeHead(200);
      res.end();
    break;

    case "POST":
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        res.setHeader('X-Auth-Token', auth(body));
        res.writeHead(200);
        res.end();
      });
    break;

    default:
      res.writeHead(405);
      res.end();
    break;
  }
});

server.listen(HTTP_SERVER_PORT, SERVER_HOST);

const wss = new WebSocketServer({
  server: server,
  clientTracking: true,
  verifyClient: (info) => {
    let access_token = info.req.url.split('?').pop().split('=').pop();
    if (!access_token) {
      return false;
    } else if (verify(access_token)) {
      return true;
    }
    return false;
  }
});

wss.on('connection', (ws, req) => onConnection(ws, req));

function onConnection(ws, req) {
  ws.uniqueID = getUniqueID();
  let username = authData[req.url.split('?').pop().split('=').pop()];

  let isNewUser = true;
  for (let client of Object.values(wss.clients)) {
    if (username === client.username) {
      isNewUser = false;
    }
  }

  wss.clients[ws.uniqueID] = {
    "username": username,
    "ws": ws
  };

  if (!avatarData[username]) {
    avatarData[username] = DEFAULT_AVATAR;
  }

  ws.on('message', (content) => onMessage(ws, content));
  ws.on('close', () => onClose(ws, username));

  if (isNewUser) {
    broadcastMessage(ws, 'newUser', username);
  }
  usersOnline(ws);
  usersNumber(ws);
  sendAllMessages(ws);
}

function onMessage(ws, content) {
  const {type, payload} = JSON.parse(content);

  switch(type) {
    case 'init':
      let username = wss.clients[ws.uniqueID]["username"];
      sendMessage(ws, "init", {
        username: username,
        avatar: avatarData[username]
      })
    break;

    case 'message':
      let usr = payload.usr;
      let text = payload.text;
      let time = payload.time;
      messageData.push({usr, text, time});

      for (let id in wss.clients) {
        if (id === ws.uniqueID) {
          sendMessage(wss.clients[id]["ws"], "message", {
            currentUsr: true,
            avatar: avatarData[usr],
            usr: usr,
            text: text,
            time: time
          });
        } else {
          sendMessage(wss.clients[id]["ws"], "message", {
            currentUsr: false,
            avatar: avatarData[usr],
            usr: usr,
            text: text,
            time: time
          });
        }
      }
    break;

    case 'avatar-updated':
      let _username = wss.clients[ws.uniqueID]["username"]
      avatarData[_username] = payload;
      for (let id in wss.clients) {
        sendMessage(wss.clients[id]["ws"], "avatar-updated", {
          username: _username,
          avatar: avatarData[_username]
        });
      }
    break;
  }
}

function onClose(ws, username) {
  delete wss.clients[ws.uniqueID];

  for (let client of Object.values(wss.clients)) {
    if (username === client.username) {
      return;
    }
  }
  broadcastMessage(ws, 'userLeft', username);
}

function CORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', 'X-Auth-Token');
}

function sendMessage(ws, type, payload) {

  ws.send(JSON.stringify({
    "type": type,
    "payload": payload
  }));
}

function auth(creds) {
  // TODO: create real auth flow
  let username = JSON.parse(creds)["username"];
  //

  for (let key in authData) {
    if (authData[key] === username) {
      return key;
    }
  }
  let access_token = generateString();
  authData[access_token] = username;
  return access_token;
}

function verify(access_token) {
  return authData[access_token] ? true : false;
}

function generateString(len = 32) {
  let id = '';
  let charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  for (let i = 0; i < len; i++ ) {
    id += charset.charAt(Math.floor(Math.random() * len));
  }
  return id;
}

function getUniqueID() {
  return generateString(8) + "-" +
    generateString(8) + "-" +
    generateString(8);
}

function broadcastMessage(ws, type, payload) {
  let currentID = ws.uniqueID;

  for (const id in wss.clients) {
    if (wss.clients[id].ws.uniqueID !== currentID) {
      sendMessage(wss.clients[id].ws, type, payload)
    }
  }
}

function usersOnline() {
  let uniqUsers = getUniqUsers();
  for (let currentUsername of uniqUsers) {
    let currentUserClients = getClientsByUsername(currentUsername);
    let arr = [];

    for (let username of uniqUsers) {
      let client = getClientsByUsername(username)[0];
      if (username !== currentUsername) {
        arr.push({
          username: client.username,
          avatar: avatarData[client.username]
        });
      }
    }

    for (let client of currentUserClients) {
      sendMessage(client.ws, 'usersOnline', arr);
    }
  }

  //
  // Object.values(wss.clients).forEach((currentClient) => {
  //   let currentWs = currentClient.ws;
  //   let currentUsername = currentClient.username;
  //   let arr = [];
  //   Object.values(wss.clients).forEach((client) => {
  //     let ws = client.ws;
  //     let username = client.username;
  //     if (ws.uniqueID !== currentWs.uniqueID && username !== currentUsername) {
  //       arr.push({
  //         username: client.username,
  //         avatar: avatarData[client.username]
  //       });
  //     }
  //   });
  //   sendMessage(currentWs, 'usersOnline', arr);
  // });
}

function getClientsByUsername(username) {
  let clients = [];
  for (let client of Object.values(wss.clients)) {
    if (client.username === username) {
      clients.push(client);
    }
  }
  return clients;
}

function getUniqUsers() {
  let uniqUsers = [];
  for (let client of Object.values(wss.clients)) {
    if (!uniqUsers.includes(client.username)) {
      uniqUsers.push(client.username);
    }
  }
  return uniqUsers;
}

function usersNumber() {
  let uniqUsers = getUniqUsers();
  for (let client of Object.values(wss.clients)) {
    sendMessage(client.ws, 'usersQuantity', uniqUsers.length);
  }
}

function sendAllMessages(ws) {
  let username = wss.clients[ws.uniqueID]["username"];
  for (let item of messageData) {
    let buf = Object.assign({}, item);
    buf.currentUsr = false;
    if (buf.usr === username) {
      buf.currentUsr = true;
    }
    buf.avatar = avatarData[buf.usr]
    sendMessage(ws, "message", buf);
  }
}


process.on('SIGINT', () => {
  wss.close();
  if (messageData && messageData !== []) {
    writeFileSync('messageDB.txt', JSON.stringify(messageData));
  }
  if (authData && authData !== {}) {
    writeFileSync('authDB.txt', JSON.stringify(authData));
  }
  if (avatarData && avatarData !== {}) {
    writeFileSync('avatarDB.txt', JSON.stringify(avatarData));
  }
  process.exit();
});
