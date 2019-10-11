import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import { firebaseConfig } from "../../shared/firebase-config";
import { ACTION, COLL, UI_VISIBILITY } from "../../shared/constants";

firebase.initializeApp(firebaseConfig);

let user = null;
let uiVisibility = UI_VISIBILITY.SHOW_ALL.id;
const provider = new firebase.auth.TwitterAuthProvider();
let unsubscribe = null;

firebase.auth().onAuthStateChanged(function(fetchedUser) {
  if (fetchedUser) {
    user = fetchedUser;
    firebase.firestore().collection('lists').doc(user.uid).get().then(doc => {
      if (doc.data().extensionPreferences) {
        uiVisibility = doc.data().extensionPreferences.uiVisibility;
      }
    });
  } else {
    unsubscribe && unsubscribe();
    unsubscribe = null;
  }
  // Change extension icon based on login state.
  // chrome.tabs.query({active:true, windowType:"normal", currentWindow: true},function(d){
  //   var tabId = d[0].id;
  //   chrome.browserAction.setIcon({path: 'images/icon1.png', tabId: tabId});
  // });
});

chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostContains: "twitter.com" }
          })
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }
    ]);
  });
});

function subscribeToList(uid) {
  if (unsubscribe) {
    unsubscribe();
  }
  unsubscribe = firebase
    .firestore()
    .collection(COLL.LISTS)
    .doc(uid)
    .collection(COLL.NOTES)
    .onSnapshot(snap => {
      if (snap) {
        const knownUsers = {};
        snap.forEach(doc => (knownUsers[doc.id] = doc.data()));
        sendMessageToPage({
          action: ACTION.PAGE.RENDER_LIST,
          visibility: uiVisibility,
          knownUsers
        });
      } else {
        console.error("Could not get list data.");
      }
    });
}

function sendMessageToPage(message) {
  console.log("sending message to page", message);
  chrome.tabs.query({ url: ["https://*.twitter.com/*"] }, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, message);
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("got request", request);
  switch (request.action) {
    case ACTION.BG.GET_UI_VISIBILITY:
      console.log("sending", uiVisibility);
      sendResponse({ uiVisibility });
      break;
    case ACTION.BG.SET_UI_VISIBILITY:
      uiVisibility = request.visibility;
      firebase.firestore().collection('lists').doc(user.uid).update({
        extensionPreferences: { uiVisibility: request.visibility }
      });
      sendMessageToPage({
        action: uiVisibility !== UI_VISIBILITY.HIDE.id ? ACTION.PAGE.RENDER_LIST : ACTION.PAGE.HIDE_LIST,
        visibility: uiVisibility
      });
      sendResponse({ uiVisibility });
      break;
    case ACTION.BG.GET_USER:
      sendResponse({ user });
      break;
    case ACTION.BG.SIGN_IN_USER:
      firebase
        .auth()
        .signInWithPopup(provider)
        .then(credential => {
          if (credential.user) {
            user = credential.user;
            sendMessageToPage({
              action: ACTION.PAGE.UPDATE_USER,
              user
            });
            // Get screenname if new user and set it as profile displayname
            if (credential.additionalUserInfo) {
              let screenName =
                credential.additionalUserInfo.profile["screen_name"];
              screenName = screenName.toLowerCase();
              if (screenName && user.displayName !== screenName) {
                user
                  .updateProfile({
                    displayName: screenName
                  })
                  .then(() => sendResponse({ user }));
              } else {
                sendResponse({ user });
              }
            }
            // Can finish asynchronously and send message when it gets
            // the data.
            subscribeToList(user.uid);
          } else {
            sendResponse({ error: "could not get user" });
          }
        });
      return true;
    case ACTION.BG.GET_LIST:
      subscribeToList(request.uid);
      sendResponse({ success: true });
      break;
    case ACTION.BG.UPDATE_NOTE:
      if (!user.uid) {
        sendResponse({ error: "User does not seem to be logged in." });
      }
      const noteRef = firebase
        .firestore()
        .collection(COLL.LISTS)
        .doc(user.uid)
        .collection(COLL.NOTES)
        .doc(request.screenname);
      noteRef
        .get()
        .then(doc => {
          return doc.exists ? "update" : "set";
        })
        .then(command => {
          return noteRef[command]({
            description: request.description,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
          });
        })
        .then(() => {
          console.log("sending success response");
          sendResponse({ success: true });
        })
        .catch(e => {
          console.log("sending error response");
          sendResponse({ error: e.message });
        });
      return true;
    case ACTION.BG.SIGN_OUT:
      unsubscribe && unsubscribe();
      unsubscribe = null;
      user = null;
      firebase
        .auth()
        .signOut()
        .then(() => sendResponse({ success: true }));
      sendMessageToPage({
        action: ACTION.PAGE.UPDATE_USER,
        user: null
      });
      return true;
    default:
      return true;
  }
});
