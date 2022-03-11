import { sendMessage } from './websocket.js';
import { DEFAULT_AVATAR } from './env.js';

document.querySelector('.right-col').scrollTop = document.querySelector('.right-col').scrollHeight;

function addMessage(currentUsr, avatarContent, user, text, time) {
  const messageBox = document.getElementById('chat');
  let fragment = document.createDocumentFragment();
  const messageElement = document.createElement('div');
  let messagePhoto = document.createElement('img');
  let messageBody = document.createElement('div');
  let messageHeader = document.createElement('div');
  let messageName = document.createElement('span');
  let messageTime = document.createElement('span');
  let messageText = document.createElement('div');

  messageElement.classList.add('user-message');
  if (currentUsr) {
    messageBox.classList.add('chat-messages--current');
    messageElement.classList.add('user-message--current');
  } else {
    messageElement.classList.add('user-message--other');
  }

  messagePhoto.setAttribute("src", `data:image/png;base64, ${avatarContent}`);
  messagePhoto.classList.add('user-message--photo');
  messageBody.classList.add('message-body')
  messageHeader.classList.add('message-header');
  messageName.innerHTML = user;
  messageName.classList.add('message-name');
  messageTime.innerHTML = time;
  messageTime.classList.add('message-time');
  messageText.innerHTML = text;
  messageText.classList.add('message-text');


  messageHeader.append(messageName, messageTime);
  messageBody.append(messageHeader, messageText);
  messageElement.append(messagePhoto);
  messageElement.append(messageBody);


  fragment.appendChild(messageElement);


  messageBox.append(fragment);
  messageBox.scrollTop = messageBox.scrollHeight;
}

function userMessage(username, text) {
  const messageBox = document.getElementById('chat');
  const messageElement = document.createElement('div');
  messageElement.classList.add('system-message')

  messageElement.appendChild(
    document.createTextNode(`${username} ${text}`)
  );

  messageBox.append(messageElement);
}

function removeOnlineUser(username) {
  let userList = document.querySelector(".users").querySelectorAll(".user__item");

  for (let user of userList) {
    let userNameElement = user.querySelector(".user__info");
    if (userNameElement && userNameElement.innerText === username) {
      user.remove();
    }
  }
}

function loadChatPage(username, avatarB64) {
  document.querySelector('.overlay').classList.add('hidden');
  document.querySelector('.container').classList.remove('hidden');
  document.getElementById('message').focus();

  document.querySelector('[data-role="current-user"]').innerHTML = username;

  let avatarModal = document.querySelector(".modal--photo");
  let avatarModalElement = avatarModal.querySelector('.modal__img');
  let avatarModalInput = avatarModal.querySelector('#modal__photo');
  let modalForm = document.querySelector('.modal__main');
  let avatarElement = document.querySelector('.avatar');

  let avatar = avatarB64 ? avatarB64 : DEFAULT_AVATAR;
  avatar = "data:image/png;base64," + avatar;
  avatarModalElement.setAttribute("src", avatar);
  avatarElement.setAttribute("src", avatar);

  avatarModalInput.addEventListener('change', () => {
    let files = avatarModalInput.files;
    if (files.length > 0 && files[0].type && files[0].type == 'image/png') {
      let file = files[0];
      getInputFileContent(file).then((fileContent) => {
        avatarModalElement.setAttribute("src", fileContent);
      });
    }
  });

  modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let files = avatarModalInput.files;
    if (files.length > 0 && files[0].type && files[0].type == 'image/png') {
      let file = files[0];
      getInputFileContent(file).then((fileContent) => {
        sendMessage("avatar-updated", fileContent.split("base64,")[1]);
        avatarElement.setAttribute("src", fileContent);
      });
      avatarModal.style.display = "none";
    }
  });

  modalForm.addEventListener('reset', (e) => {
    avatarModal.style.display = "none";
  });

  avatarElement.addEventListener('click', (e) => {
    avatarModalElement.setAttribute("src", avatar);
    avatarModal.style.display = "block";
  });

  avatarElement.addEventListener('dragover', (e) => {
   if (e.dataTransfer.items.length && e.dataTransfer.items[0].kind === 'file') {
      e.preventDefault();
    }
  })

  avatarElement.addEventListener('drop', (e) => {
    e.preventDefault();

    const file = e.dataTransfer.items[0].getAsFile();
    getInputFileContent(file).then((fileContent) => {
      sendMessage("avatar-updated", fileContent.split("base64,")[1])
      avatarElement.setAttribute("src", fileContent);
      document.querySelector('.modal__img').setAttribute("src", fileContent);;
    });
  })

  document.getElementById('messageForm').addEventListener('submit', (e) => {
    e.preventDefault();

    if (message) {
      sendMessage(
        "message",
        {
          usr: username,
          text: document.getElementById('message').value,
          time: `${new Date().getHours()}:${new Date().getMinutes()}`
        }
      );
      document.getElementById('message').value = '';
    }
  });
}

function allUsersOnline(users) {
  let usersBox = document.querySelector('.users');
  usersBox.innerHTML = '';

  users.forEach(user => {
    let userElement = document.createElement('li');
    userElement.classList.add("user__item")
    usersBox.append(userElement);

    let userInfoElement = document.createElement('div');
    userInfoElement.setAttribute('class', 'user__info');
    userElement.append(userInfoElement);

    let userPhotoElement = document.createElement('div');
    userPhotoElement.setAttribute('class', 'user__photo');
    userInfoElement.append(userPhotoElement);

    let userAvatarElement = document.createElement('img');
    userAvatarElement.setAttribute('class', 'avatar');
    userAvatarElement.setAttribute('src', `data:image/png;base64,${user.avatar}`);
    userPhotoElement.append(userAvatarElement);

    let userNameElement = document.createElement('div');
    userNameElement.setAttribute('class', 'user__name');
    userNameElement.setAttribute('data-role', 'online-user');
    userNameElement.innerText = user.username;
    userInfoElement.append(userNameElement);
  });
}

function usersQuantity(usersN) {
  let element = document.querySelector('[data-role="online-quantity"]');

  switch (true){
    case (usersN == 1):
      element.innerHTML = `${usersN} участник`
      break;

    case (usersN > 1 && usersN < 5):
      element.innerHTML = `${usersN} участника`
      break;

    case (usersN >= 5):
      element.innerHTML = `${usersN} участников`
      break;

  }
}

function updateUserAvatars(username, avatar) {
  let userMessages = document.querySelectorAll(".user-message");
  let userList = document.querySelectorAll(".user__info");

  function renderAvatars(list, className, username, avatar) {
    for (let item of list) {
      let userNameElement = item.querySelector(`.${className}`);
      if (userNameElement && userNameElement.innerText === username) {
        let avatarElement = item.querySelector("img");
        if (avatarElement) {
          avatarElement.setAttribute(
            "src",
            "data:image/png;base64," + avatar
          );
        }
      }
    }
  }

  renderAvatars(userMessages, "message-name", username, avatar);
  renderAvatars(userList, "user__name", username, avatar);
}

function getInputFileContent(file) {
  return new Promise((resolve) => {
    let reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result);
    }
    reader.readAsDataURL(file);
  });
}

export {
  loadChatPage,
  userMessage,
  addMessage,
  allUsersOnline,
  usersQuantity,
  updateUserAvatars,
  removeOnlineUser
}
