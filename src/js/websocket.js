import { loadChatPage, userMessage, allUsersOnline, usersQuantity, addMessage, updateUserAvatars, removeOnlineUser } from "./page.js";
import { SERVER_DOMAIN, WS_SERVER_PORT } from './env.js';

const WS_SERVER_URL = "ws://" + SERVER_DOMAIN + ":" + WS_SERVER_PORT;
let ws;

function initConnect(access_token) {
  ws = new WebSocket(WS_SERVER_URL + '?access_token=' + access_token);
  ws.onmessage = e => onMessage(e);
  // ws.onclose = e => onClose(e);
  return new Promise((resolve, reject) => {
    ws.onopen = e => {
      sendMessage("init", "");
      resolve(e);
    };
    ws.onerror = e => {
      reject(e);
    };
  });
}

function onMessage(message) {
  const json = JSON.parse(message.data);
  switch(json.type) {
    case "init":
      initMessageHandler(
        json.payload.username,
        json.payload.avatar
      );
    break;

    case "message":
      addMessage(
        json.payload.currentUsr,
        json.payload.avatar,
        json.payload.usr,
        json.payload.text,
        json.payload.time
      );
    break;

    case 'newUser':
      userMessage(json.payload, 'joined the chat!');
    break;

    case 'userLeft':
      userMessage(json.payload, 'left.');
      removeOnlineUser(json.payload);
    break;

    case 'usersOnline':
      allUsersOnline(json.payload);
    break;

    case 'usersQuantity':
      usersQuantity(json.payload);
    break;

    case 'avatar-updated':
      updateUserAvatars(
        json.payload.username,
        json.payload.avatar
      );
    break;

    default:
    console.log('unknown type!')
  }
}

function initMessageHandler(username, avatarContent) {
  loadChatPage(username, avatarContent);
}

function sendMessage(type, payload) {
  ws.send(JSON.stringify({
    "type": type,
    "payload": payload
  }));
}

export {
  initConnect,
  sendMessage
}
