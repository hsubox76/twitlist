import { appendNewElement } from "../../../shared/dom-utils";

export function renderHeader({ user }, parent, renderer) {
  function login() {
    return firebase.auth().signInWithPopup(provider);
  }

  function logout() {
    firebase
      .auth()
      .signOut()
      .then(() => renderer.setState({ user: null, list: [], params: {} }));
  }

  const headerContainer = appendNewElement(parent, {
    id: "header-container",
    className: "container"
  });
  appendNewElement(headerContainer, { className: "title", text: "twitlist" });
  const loginContainer = appendNewElement(headerContainer, {
    className: "login-container"
  });
  const loginTextEl = appendNewElement(loginContainer, { id: "login-text" });
  const loginTextButton = appendNewElement(loginContainer, {
    tag: "button",
    id: "login-button",
    text: "log in"
  });
  if (user) {
    loginTextEl.textContent = `logged in as ${user.displayName}`;
    loginTextButton.removeEventListener("click", login);
    loginTextButton.addEventListener("click", logout);
    loginTextButton.textContent = "log out";
  } else {
    loginTextEl.textContent = "not logged in";
    loginTextButton.removeEventListener("click", logout);
    loginTextButton.addEventListener("click", login);
    loginTextButton.textContent = "log in";
  }
}
