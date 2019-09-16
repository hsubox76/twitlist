import { sendMessage } from "./util";
import { ACTION } from "../../shared/constants";

let loginButton = document.getElementById("login-button");
let loginText = document.getElementById("login-text");
let visibilitySection = document.getElementById("visibility-section");
let visibilityCheckbox = document.getElementById("visibility-checkbox");

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
    loginText.textContent = `logged in as @${user.displayName}`;
    loginButton.removeEventListener("click", login);
    loginButton.addEventListener("click", logout);
    loginButton.classList.remove("sign-in");
    visibilitySection.setAttribute("style", "display: block");
  } else {
    loginButton.textContent = "sign in with Twitter";
    loginText.textContent = `you are not logged in`;
    loginButton.removeEventListener("click", logout);
    loginButton.addEventListener("click", login);
    loginButton.classList.add("sign-in");
    visibilitySection.setAttribute("style", "display: none");
  }
}

function toggleVisibilityText(response) {
  if (response.isUIVisible) {
    visibilityCheckbox.checked = true;
  } else {
    visibilityCheckbox.checked = false;
  }
}

function toggleUI() {
  sendMessage({ action: ACTION.BG.TOGGLE_UI });
  // .then(toggleVisibilityText);
}
sendMessage({ action: ACTION.BG.GET_UI_VISIBILITY }).then(toggleVisibilityText);
visibilityCheckbox.addEventListener("change", toggleUI);
sendMessage({ action: ACTION.BG.GET_USER }).then(handleUserResponse);
