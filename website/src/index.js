import firebase, { app } from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import { firebaseConfig } from "../../shared/firebase-config";
import {
  appendNewElement,
  createRenderer,
  getValueAtId,
  getParams,
  deleteElement
} from "../../shared/dom-utils";

firebase.initializeApp(firebaseConfig);
const provider = new firebase.auth.TwitterAuthProvider();

function login() {
  return firebase.auth().signInWithPopup(provider);
}

function logout() {
  return firebase.auth().signOut();
}

function postNewNote({ user }, renderer) {
  if (!user.uid) return;
  const description = getValueAtId("user-description");
  const screenname = getValueAtId("user-screen-name");
  const twitterId = getValueAtId("user-twitter-id");
  if (!description || !screenname) return;
  // TODO: disable form
  const userAddButton = document.getElementById("user-add-submit");
  const userDescription = document.getElementById("user-description");
  userAddButton.setAttribute('disabled', true);
  userDescription.setAttribute('disabled', true);
  firebase
    .firestore()
    .collection("lists")
    .doc(user.uid)
    .collection("notes")
    .doc(screenname.toLowerCase())
    .set({
      description,
      twitterId,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(function onSuccessfulPost() {
      window.history.pushState({}, "", "/");
      const userAddForm = document.getElementById("user-add-form");
      // userAddForm.style.display = 'none';
      getList(user.uid).then(list => renderer.setState({ list }));
      userAddButton.setAttribute('disabled', false);
      userDescription.setAttribute('disabled', false);
    })
    .catch(function onFailedPost(e) {
      console.error(e);
      userAddButton.setAttribute('disabled', false);
      userDescription.setAttribute('disabled', false);
    });
}

function sortList(list, sortBy, direction = 1) {
  const sortedList = list.sort((a, b) => {
    if (a[sortBy] < b[sortBy]) {
      return -direction;
    }
    if (a[sortBy] > b[sortBy]) {
      return direction;
    }
    return 0;
  });
  return sortedList;
}

function init() {
  const renderer = createRenderer({
    user: null,
    isLoading: true,
    list: [],
    sortBy: 'screenname',
    sortDirection: 1
  });

  renderer.subscribe(renderHeader);
  renderer.subscribe(renderContent);
  renderer.render();
  firebase.auth().onAuthStateChanged(function handleAuthState(fetchedUser) {
    if (fetchedUser) {
      renderer.setState({ user: fetchedUser });
      getList(renderer.getState().user.uid).then(function (list) {
        renderer.setState({ list });
      });
    }
    renderer.setState({ isLoading: false });
  });

  window.addEventListener('popstate', () => {
    renderer.render();
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
        return tempList;
      } else {
        throw new Error ("Could not get list");
      }
    })
    .catch(e => console.error(e));
}

function renderHeader({ user }, parent) {
  const headerContainer = appendNewElement(parent, {
    id: 'header-container',
    className: 'container'
  });
  appendNewElement(headerContainer, { className: 'title', text: 'twitlist' });
  const loginContainer =
    appendNewElement(headerContainer, { className: 'login-container' });
  const loginTextEl = appendNewElement(loginContainer, { id: 'login-text' });
  const loginTextButton = appendNewElement(loginContainer, {
    tag: 'button',
    id: 'login-button',
    text: 'log in'
  });
  if (user) {
    loginTextEl.textContent = `logged in as ${user.displayName}`;
    loginTextButton.removeEventListener("click", login);
    loginTextButton.addEventListener("click", logout);
    loginTextButton.textContent = "log out";
    return () => loginTextButton.removeEventListener("click", logout);
  } else {
    loginTextEl.textContent = "not logged in";
    loginTextButton.removeEventListener("click", logout);
    loginTextButton.addEventListener("click", login);
    loginTextButton.textContent = "log in";
    return () => loginTextButton.removeEventListener("click", login);
  }
}

function renderContent(state, parent, renderer) {

  function onPostClick(e) {
    e.preventDefault();
    postNewNote(state, renderer);
  }

  function onEditClick(e) {
    e.preventDefault();
    const data = e.target.dataset;
    window.history.pushState({}, '',
      `/?screenname=${data.screenname}&tid=${data.tid}&mode=edit`);
    renderer.render();
  }

  function onSortClick(e) {
    e.preventDefault();
    const { list, sortBy, sortDirection } = state;
    const sortedList = sortList(list, sortBy, sortDirection);
    renderer.setState({
      list: sortedList,
      sortDirection: -sortDirection
    });
  }

  const contentContainer = appendNewElement(parent, {
    id: 'content-container'
  })
  state.isLoading && renderLoader(state, contentContainer);
  if (!state.list || !state.list.length) return;
  renderAddForm(state, contentContainer, { onPostClick });
  renderList(state, contentContainer, { onEditClick, onSortClick });
  renderSharedLists(state, contentContainer);
}

function renderLoader(state, parent) {
  if (state.user) return;
  const loadingContainer = appendNewElement(parent, {
    className: 'container',
    id: 'content-loading-container'
  });
  appendNewElement(loadingContainer, { className: 'spinner' });
}

function renderAddForm(state, parent, { onPostClick }) {
  const params = getParams();
  if (!params.screenname) {
    return;
  }
  const isEditMode = params.mode === "edit";
  const userAddForm = appendNewElement(parent, {
    id: 'user-add-form',
    className: 'container',
    tag: 'form'
  });
  appendNewElement(userAddForm, {
    id: 'form-text',
    text:
      `${isEditMode ? "Edit" : "Add a"} note about user: @${params.screenname}`
  });
  const userDescriptionInput = appendNewElement(userAddForm, {
    tag: 'textarea',
    id: 'user-description',
    rows: 4
  });
  const buttonContainer = appendNewElement(userAddForm, {});
  appendNewElement(buttonContainer, {
    tag: 'button',
    id: 'user-add-submit',
    text: 'add note'
  });
  if (isEditMode) {
    userDescriptionInput.value = state.list.find(
      item => item.screenname === params.screenname
    ).description;
  }
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

  userAddForm.addEventListener("submit", onPostClick);

  return () => userAddForm.removeEventListener("submit", onPostClick);
}

function renderList({ list, sortBy, sortDirection }, parent, { onSortClick, onEditClick }) {
  const sortedList = sortList(list, sortBy, sortDirection);
  const tableContainer = renderTableContainer(parent, 'user-list', 'your list', list.length);
  if (!tableContainer) return;
  const listTable = document.getElementById("user-list-table");
  listTable.innerHTML = "";
  const headerRow = appendNewElement(listTable, {
    className: "header-row"
  });
  appendNewElement(headerRow, {
    text: `Twitter User${sortBy === 'screenname' ? (sortDirection === 1 ? ' ▼' : ' ▲') : ''}`,
    onClick: onSortClick
  });
  appendNewElement(headerRow, { text: "Your Note" });
  for (const user of sortedList) {
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

function renderSharedLists(state, parent) {
  renderTableContainer(parent, 'shared-lists', 'shared lists', 'blah');
}

function renderTableContainer(parent, name, title, content) {
  const existingEl = document.getElementById(name + '-container');
  if (existingEl) deleteElement(existingEl);
  if (!content) return;
  const containerEl = appendNewElement(parent, {
    id: name + '-container',
    className: 'container'
  });
  appendNewElement(containerEl, { tag: 'h2', text: title });
  appendNewElement(containerEl, { id: name + '-table' });
  return containerEl;
}

init();
