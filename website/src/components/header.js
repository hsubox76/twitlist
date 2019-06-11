import firebase from "firebase/app";
import "firebase/auth";
import { appendNewElement } from "../../../shared/dom-utils";

const provider = new firebase.auth.TwitterAuthProvider();

export function renderHeader({ user, params, listUnsub }, parent, renderer) {
  function login() {
    return firebase.auth().signInWithPopup(provider)
    .then(credential => {
      if (credential.user) {
        // Get screenname if new user and set it as profile displayname
        if (credential.additionalUserInfo) {
          let screenName =
            credential.additionalUserInfo.profile["screen_name"];
          screenName = screenName.toLowerCase();
          if (screenName && credential.user.displayName !== screenName) {
            credential.user
              .updateProfile({
                displayName: screenName
              })
              .then(() => renderer.setState({ user: credential.user }));
          } else {
            renderer.setState({ user: credential.user });
          }
        }
      } else {
        // TODO: log error
      }
    });
  }

  function logout() {
    listUnsub && listUnsub();
    firebase
      .auth()
      .signOut()
      .then(() => renderer.setState({ user: null, list: [], params: {} }));
  }

  const headerContainer = appendNewElement(parent, {
    id: "header-container",
    className: "container"
  });
  const leftContainer = appendNewElement(headerContainer, {
    className: "left-container"
  });
  appendNewElement(leftContainer, {
    tag: 'a',
    className: "title",
    text: "twitlist",
    onClick: e => {
      e.preventDefault();
      renderer.setState({ params: {} });
    }
  });
  const pageTitle = params.listname ? `@${params.listname}'s list` : 'your list';
  appendNewElement(leftContainer, { className: "subtitle", text: pageTitle });
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
