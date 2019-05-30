import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import { firebaseConfig } from '../../shared/firebase-config';

firebase.initializeApp(firebaseConfig);

let user = null;
let list = [];
const provider = new firebase.auth.TwitterAuthProvider();

const loginTextEl = document.getElementById('login-text');
const loginTextButton = document.getElementById('login-button');

function login() {
  return firebase.auth().signInWithPopup(provider);
}

function logout() {
  return firebase.auth().signOut();
}

function init() {
  initAuth();
  renderAll();
}

function renderAll() {
  renderList();
  renderAddForm();
}

function initAuth() {
  firebase.auth().onAuthStateChanged(function(fetchedUser) {
    if (fetchedUser) {
      user = fetchedUser;
      renderHeader(user);
      getList(user.uid);
    } else {
      renderHeader();
    }
  });
}

function getList(uid) {
  return firebase.firestore()
    .collection('lists')
    .doc(uid)
    .collection('notes')
    .get()
    .then(snap => {
      if (snap) {
        const tempList = [];
        snap.forEach(doc => tempList.push(Object.assign({ screenname: doc.id }, doc.data())));
        list = tempList;
      } else {
        console.error('Could not get list');
      }
    })
    .catch(e => console.error(e));
}

function renderHeader(user) {
  if (user) {
    loginTextEl.textContent = `logged in as ${user.displayName}`;
    loginTextButton.removeEventListener('click', login);
    loginTextButton.addEventListener('click', logout);
    loginTextButton.textContent = "log out";
    getList(user.uid).then(renderList);
  } else {
    loginTextEl.textContent = 'not logged in';
    loginTextButton.removeEventListener('click', logout);
    loginTextButton.addEventListener('click', login);
    loginTextButton.textContent = "log in";
  }
}

function postNewNote(e) {
  e.preventDefault();
  if (!user.uid) return;
  const userScreenName = document.getElementById('user-screen-name');
  const userDescription = document.getElementById('user-description');
  const userTwitterId = document.getElementById('user-twitter-id');
  const description = userDescription.value;
  const screenname = userScreenName.value;
  const twitterId = userTwitterId.value;
  if (!description || !screenname) return;
  // TODO: disable form
  firebase.firestore()
    .collection('lists')
    .doc(user.uid)
    .collection('notes')
    .doc(screenname.toLowerCase())
    .set({
      description,
      twitterId
    })
    .then(() => {
      window.history.pushState({}, '', '/');
      const userAddForm = document.getElementById('user-add-form');
      userAddForm.classList = '';
      getList(user.uid).then(renderList);
    });
}

function renderAddForm() {
  const queryString = window.location.search;
  if (!queryString) return;
  let params = {};
  queryString.slice(1).split('&').forEach(pair => {
    const parts = pair.split('=');
    params[parts[0]] = parts[1];
  });
  if (!params.screenname) return;
  const userAddForm = document.getElementById('user-add-form');
  const formText = document.getElementById('form-text');
  const userTwitterId = document.createElement('input');
  userTwitterId.setAttribute('type', 'hidden');
  userTwitterId.setAttribute('id', 'user-twitter-id');
  userTwitterId.setAttribute('value', params.tid);
  userAddForm.appendChild(userTwitterId);
  const userScreenName = document.createElement('input');
  userScreenName.setAttribute('type', 'hidden');
  userScreenName.setAttribute('id', 'user-screen-name');
  userScreenName.setAttribute('value', params.screenname);
  userAddForm.appendChild(userScreenName);
  userAddForm.classList = 'shown';
  formText.textContent = `Add a note about user: ${params.screenname}`;
  userAddForm.addEventListener('submit', postNewNote);
}

function renderList() {
  const listContainer = document.getElementById('user-list-container');
  listContainer.innerHTML = '';
  if (list.length) {
    const headerRow = document.createElement('div');
    headerRow.classList = 'header-row';
    const usernameHeaderEl = document.createElement('div');
    const userDescriptionHeaderEl = document.createElement('div');
    usernameHeaderEl.textContent = 'Twitter User';
    userDescriptionHeaderEl.textContent = 'Your Note';
    headerRow.appendChild(usernameHeaderEl);
    headerRow.appendChild(userDescriptionHeaderEl);
    listContainer.appendChild(headerRow);
  }
  for (const user of list) {
    const userRow = document.createElement('div');
    userRow.classList = 'user-row';
    const usernameEl = document.createElement('div');
    usernameEl.classList = 'username-cell';
    const userDescriptionEl = document.createElement('div');
    const usernameLink = document.createElement('a');
    usernameLink.setAttribute('href', `https://twitter.com/${user.screenname}`);
    usernameLink.setAttribute('target', '_blank');
    usernameLink.textContent = `@${user.screenname}`;
    usernameEl.appendChild(usernameLink);
    userRow.appendChild(usernameEl);
    userRow.appendChild(userDescriptionEl);
    userDescriptionEl.textContent = user.description;
    listContainer.appendChild(userRow);
  }
}

init();