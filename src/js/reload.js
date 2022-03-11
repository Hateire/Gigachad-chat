import {openSocket} from './websocket.js'
import {logIn} from './login.js'

export function onReaload() {
  let cookie = document.cookie.split('; ').reduce((prev, current) => {
    const [name, value] = current.split('=');
    prev[name] = value;
    return prev;
  }, {});
  let access_token = cookie.access_token;

  if(access_token) {
    document.querySelector('.overlay').classList.add('hidden');
    document.querySelector('.container').classList.remove('hidden');

    openSocket(access_token);

  } else {

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nickname = document.getElementById('loginInput').value;
      
      if (nickname) {
        logIn();
        document.getElementById('loginInput').value = '';

      } else {
        document.getElementById("authentication-error").innerHTML = "необходимо ввести никнейм";
      }
    })
  }
}