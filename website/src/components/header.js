import { getFirebase, logInToFirebase } from "../db";
import { appendNewElement } from "../../../shared/dom-utils";

export function renderHeader(
  { user, listProperties, listUnsub, userIsLoading },
  parent,
  renderer
) {
  function login() {
    logInToFirebase(renderer);
  }

  function logout() {
    listUnsub && listUnsub();
    getFirebase().then(firebase => {
      firebase
        .auth()
        .signOut()
        .then(() => renderer.setState({ user: null, list: [], params: {} }));
    });
  }

  const headerContainer = appendNewElement(parent, {
    id: "header-container",
    className: "container"
  });
  const leftContainer = appendNewElement(headerContainer, {
    className: "left-container"
  });
  appendNewElement(leftContainer, {
    tag: "a",
    href: "/",
    className: "title",
    text: "twitlist"
  });
  let pageTitle = "";
  if (
    user &&
    listProperties &&
    user.displayName === listProperties.creatorScreenname
  ) {
    pageTitle = "your list";
  } else if (listProperties && listProperties.creatorScreenname) {
    pageTitle = `@${listProperties.creatorScreenname}'s list`;
  } else if (user) {
    pageTitle = "loading list";
  }
  appendNewElement(leftContainer, { className: "subtitle", text: pageTitle });
  const loginContainer = appendNewElement(headerContainer, {
    className: "login-container"
  });
  appendNewElement(loginContainer, {
    tag: "a",
    href: "faq.html",
    className: "header-faq-link",
    text: "FAQ"
  });
  if (userIsLoading) {
    appendNewElement(loginContainer, { id: "login-text", text: "wait..." });
    return;
  }
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
