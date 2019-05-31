import { sendMessage } from "./util";
let loginButton = document.getElementById("login-button");
let loginText = document.getElementById("login-text");

let user = null;

function login() {
  sendMessage({ action: "SIGN_IN_USER" }).then(handleUserResponse);
}

function logout() {
  sendMessage({ action: "SIGN_OUT" }).then(handleUserResponse);
}

function handleUserResponse(response) {
  console.log(response);
  if (response.user) {
    user = response.user;
    loginButton.textContent = "sign out";
    loginText.textContent = `logged in as ${user.displayName}`;
    loginButton.removeEventListener("click", login);
    loginButton.addEventListener("click", logout);
  } else {
    loginButton.textContent = "sign in with Twitter";
    loginText.textContent = `not logged in`;
    loginButton.removeEventListener("click", logout);
    loginButton.addEventListener("click", login);
  }
}

sendMessage({ action: "GET_USER" }).then(handleUserResponse);
