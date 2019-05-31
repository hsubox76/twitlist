import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import { firebaseConfig } from "../../shared/firebase-config";
import {
  appendNewElement,
  setTextContentForId,
  getValueAtId,
  getParams,
  deleteElement
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
  document.getElementById('content-container').style.display = 'none';
  return firebase.auth().signOut();
}

function init() {
  firebase.auth().onAuthStateChanged(function handleAuthState(fetchedUser) {
    document.getElementById('content-container').style.display = 'block';
    document.getElementById('content-loading-container').style.display = 'none';
    if (fetchedUser) {
      user = fetchedUser;
      renderHeader(user);
      getList(user.uid).then(function renderFetchedData() {
        renderList();
        renderSharedLists();
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

function renderAddForm(params = getParams()) {
  const userAddForm = document.getElementById("user-add-form");
  if (!params.screenname) {
    userAddForm.style.display = 'none';
    return;
  }
  userAddForm.style.display = 'flex';
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
  userAddForm.style.display = "flex";
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

function onEditClick(e) {
  e.preventDefault();
  const data = e.target.dataset;
  window.history.pushState({}, '',
    `/?screenname=${data.screenname}&tid=${data.tid}&mode=edit`);
  renderAddForm(Object.assign({ mode: 'edit' }, data));
}

window.addEventListener('popstate', () => {
  console.log('popstate');
  renderAddForm();
});

function renderList() {
  renderTableContainer('user-list', 'your list', list.length);
  const listTable = document.getElementById("user-list-table");
  listTable.innerHTML = "";
  const headerRow = appendNewElement(listTable, {
    className: "header-row"
  });
  appendNewElement(headerRow, { text: "Twitter User" });
  appendNewElement(headerRow, { text: "Your Note" });
  for (const user of list) {
    const userRow = appendNewElement(listTable, {
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
      onClick: onEditClick,
      data: {
        screenname: user.screenname,
        tid: user.twitterId
      },
      href: `/?screenname=${user.screenname}&tid=${user.twitterId}&mode=edit`,
      text: "edit"
    });
  }
}

function renderSharedLists() {
  renderTableContainer('shared-lists', 'shared lists', 'blah');
}

function renderTableContainer(name, title, content) {
  const existingEl = document.getElementById(name + '-container');
  if (existingEl) deleteElement(existingEl);
  if (!content) return;
  const contentContainer = document.getElementById('content-container');
  const containerEl = appendNewElement(contentContainer, {
    id: name + '-container',
    className: 'container'
  });
  appendNewElement(containerEl, { tag: 'h2', text: title });
  appendNewElement(containerEl, { id: name + '-table' });
}

init();
