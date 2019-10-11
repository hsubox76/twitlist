import { sendMessage } from "./util";
import { ACTION, APP_URL, UI_VISIBILITY } from "../../shared/constants";
import {
  appendNewElement
} from "../../shared/dom-utils";

let loginButton = document.getElementById("login-button");
let loginText = document.getElementById("login-text");
let visibilitySection = document.getElementById("visibility-section");
let webLinkAnchor = document.getElementById("web-link-anchor");

let user = null;

webLinkAnchor.href = APP_URL;

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
  for (const key of Object.keys(UI_VISIBILITY)) {
    if (UI_VISIBILITY[key].id === response.uiVisibility) {
      document.getElementById(UI_VISIBILITY[key].id).checked = true;
    } else {
      document.getElementById(UI_VISIBILITY[key].id).checked = false;
    }
  }
}

function setVisibility(e) {
  sendMessage({ action: ACTION.BG.SET_UI_VISIBILITY, visibility: e.target.value })
    .then(toggleVisibilityText);
}

visibilitySection.innerHTML = '';
for (const key of Object.keys(UI_VISIBILITY)) {
  const visOption = UI_VISIBILITY[key];
  const radioContainer = appendNewElement(visibilitySection);
  appendNewElement(radioContainer, {
    tag: 'input',
    type: 'radio',
    onClick: setVisibility,
    value: visOption.id,
    id: visOption.id
  });
  appendNewElement(radioContainer, {
    tag: 'label',
    'for': visOption.id,
    text: visOption.desc
  })
}
sendMessage({ action: ACTION.BG.GET_UI_VISIBILITY }).then(toggleVisibilityText);
sendMessage({ action: ACTION.BG.GET_USER }).then(handleUserResponse);
