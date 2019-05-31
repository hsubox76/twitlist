import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import { firebaseConfig } from "../../shared/firebase-config";
import {
  appendNewElement,
  setTextContentForId,
  getValueAtId,
  getParams
} from "../../shared/dom-utils";

firebase.initializeApp(firebaseConfig);

let user = null;
let list = [];
const provider = new firebase.auth.TwitterAuthProvider();

const loginTextEl = document.getElementById("login-text");
const loginTextButton = document.getElementById("login-button");

function login() {
  return firebase.auth().signInWithPopup(provider);
}

function logout() {
  return firebase.auth().signOut();
}

function init() {
  firebase.auth().onAuthStateChanged(function handleAuthState(fetchedUser) {
    if (fetchedUser) {
      user = fetchedUser;
      renderHeader(user);
      getList(user.uid).then(function renderFetchedData() {
        renderList();
        renderAddForm();
      });
    } else {
      renderHeader();
    }
  });
}

function getList(uid) {
  return firebase
    .firestore()
    .collection("lists")
    .doc(uid)
    .collection("notes")
    .get()
    .then(function handleListSnapshot(snap) {
      if (snap) {
        const tempList = [];
        snap.forEach(doc =>
          tempList.push(Object.assign({ screenname: doc.id }, doc.data()))
        );
        list = tempList;
      } else {
        throw new Error ("Could not get list");
      }
    })
    .catch(e => console.error(e));
}

function renderHeader(user) {
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

function postNewNote(e) {
  e.preventDefault();
  if (!user.uid) return;
  const description = getValueAtId("user-description");
  const screenname = getValueAtId("user-screen-name");
  const twitterId = getValueAtId("user-twitter-id");
  if (!description || !screenname) return;
  // TODO: disable form
  firebase
    .firestore()
    .collection("lists")
    .doc(user.uid)
    .collection("notes")
    .doc(screenname.toLowerCase())
    .set({
      description,
      twitterId
    })
    .then(function onSuccessfulPost() {
      window.history.pushState({}, "", "/");
      const userAddForm = document.getElementById("user-add-form");
      userAddForm.classList = "container";
      getList(user.uid).then(renderList);
      // TODO: enable form (even though it's hidden)
    });
}

function renderAddForm() {
  const params = getParams();
  if (!params.screenname) return;
  const userAddForm = document.getElementById("user-add-form");
  const isEditMode = params.mode === "edit";
  appendNewElement(userAddForm, {
    tag: "input",
    type: "hidden",
    id: "user-twitter-id",
    value: params.tid
  });
  appendNewElement(userAddForm, {
    tag: "input",
    type: "hidden",
    id: "user-screen-name",
    value: params.screenname
  });
  userAddForm.classList = "container shown";
  setTextContentForId(
    "form-text",
    `${isEditMode ? "Edit" : "Add a"} note about user: @${params.screenname}`
  );
  if (isEditMode) {
    const userDescriptionInput = document.getElementById("user-description");
    userDescriptionInput.value = list.find(
      item => item.screenname === params.screenname
    ).description;
  }

  userAddForm.addEventListener("submit", postNewNote);
}

function renderList() {
  const listContainer = document.getElementById("user-list-container");
  listContainer.innerHTML = "";
  if (list.length) {
    const headerRow = appendNewElement(listContainer, {
      className: "header-row"
    });
    appendNewElement(headerRow, { text: "Twitter User" });
    appendNewElement(headerRow, { text: "Your Note" });
    for (const user of list) {
      const userRow = appendNewElement(listContainer, {
        className: "user-row"
      });
      const usernameCell = appendNewElement(userRow, {
        className: "username-cell"
      });
      appendNewElement(usernameCell, {
        tag: "a",
        href: `https://twitter.com/${user.screenname}`,
        target: "_blank",
        text: `@${user.screenname}`
      });
      appendNewElement(userRow, { text: user.description });
      const editCell = appendNewElement(userRow, { className: "edit-cell" });
      appendNewElement(editCell, {
        tag: "a",
        href: `/?screenname=${user.screenname}&tid=${user.twitterId}&mode=edit`,
        text: "edit"
      });
    }
  }
}

init();
