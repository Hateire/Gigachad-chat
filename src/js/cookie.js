function setCookie(key, value, exp) {
  let expires = ""
  if (exp) {
    let d = new Date();
    d.setTime(d.getTime() + exp);
    expires = ";expires=" + d.toUTCString();
  }
  document.cookie = key + "=" + value + expires + ";path=/";
}

function getCookie(key) {
  let name = key + "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function removeCookie(name) {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

export {
  getCookie,
  setCookie,
  removeCookie
}
