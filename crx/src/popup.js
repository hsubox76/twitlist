import { sendMessage } from "./util";
import { ACTION } from '../../shared/constants';

let loginButton = document.getElementById("login-button");
let loginText = document.getElementById("login-text");
let visibilityButton = document.getElementById("visibility-button");

let user = null;

function login() {
  sendMessage({ action: ACTION.BG.SIGN_IN_USER }).then(handleUserResponse);
}

function logout() {
  sendMessage({ action: ACTION.BG.SIGN_OUT }).then(handleUserResponse);
}

function handleUserResponse(response) {
  if (response.user) {
    user = response.user;
    loginButton.textContent = "sign out";
    loginText.textContent = `logged in as ${user.displayName}`;
    loginButton.removeEventListener("click", login);
    loginButton.addEventListener("click", logout);
    visibilityButton.setAttribute('style', 'display: block');
  } else {
    loginButton.textContent = "sign in with Twitter";
    loginText.textContent = `not logged in`;
    loginButton.removeEventListener("click", logout);
    loginButton.addEventListener("click", login);
    visibilityButton.setAttribute('style', 'display: none');
  }
}

function toggleVisibilityText(response) {
  if (response.isUIVisible) {
    visibilityButton.textContent = 'click to hide UI on tweets';
    visibilityButton.classList.remove('outline');
  } else {
    visibilityButton.textContent = 'click to show UI on tweets';
    visibilityButton.classList.add('outline');
  }
}

function toggleUI() {
  sendMessage({ action: ACTION.BG.TOGGLE_UI })
    .then(toggleVisibilityText);
}
sendMessage({ action: ACTION.BG.GET_UI_VISIBILITY }).then(toggleVisibilityText);
visibilityButton.addEventListener("click", toggleUI);
sendMessage({ action: ACTION.BG.GET_USER }).then(handleUserResponse);
