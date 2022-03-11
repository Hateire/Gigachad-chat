import { SERVER_DOMAIN, HTTP_SERVER_PORT } from './env.js';

function getAccessToken(credentials) {
  let access_token;

  let req = new XMLHttpRequest();
  req.open("POST", "http://" + SERVER_DOMAIN + ":" + HTTP_SERVER_PORT);
  req.setRequestHeader("Content-Type", "application/json");
  
  return new Promise((resolve, reject) => {
    req.onreadystatechange = () => {
      if (req.readyState === req.DONE) {
        if (req.status === 200) {
          access_token = req.getResponseHeader("X-Auth-Token");
          if (access_token && access_token.length > 0) {
            resolve(access_token);
          }
        }
        reject();
      }
    }
    req.send(JSON.stringify(credentials));
  });
}

export { getAccessToken }

// 