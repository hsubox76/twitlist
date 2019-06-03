import { firebaseConfig } from "../../shared/firebase-config";

firebase.initializeApp(firebaseConfig);

let user = null;
const provider = new firebase.auth.TwitterAuthProvider();
let unsubscribe = null;

firebase.auth().onAuthStateChanged(function(fetchedUser) {
  if (fetchedUser) {
    user = fetchedUser;
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
    .collection("lists")
    .doc(uid)
    .collection("notes")
    .onSnapshot(snap => {
      if (snap) {
        const knownUsers = {};
        snap.forEach(doc => (knownUsers[doc.id] = doc.data()));
        sendMessageToPage({
          action: "RENDER_LIST",
          knownUsers
        });
      } else {
        console.error('Could not get list data.');
      }
    });
}

function sendMessageToPage(message) {
  console.log('sending message to page', message);
  chrome.tabs.query({ url: ['https://*.twitter.com/*'] }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, message);
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("got request", request);
  switch (request.action) {
    case "GET_USER":
      sendResponse({ user });
      break;
    case "SIGN_IN_USER":
      firebase
        .auth()
        .signInWithPopup(provider)
        .then(credential => {
          if (credential.user) {
            user = credential.user;
            sendMessageToPage({
              action: "UPDATE_USER",
              user
            });
            // Get screenname if new user and set it as profile displayname
            if (credential.additionalUserInfo) {
              let screenName =
                credential.additionalUserInfo.profile["screen_name"];
              screenName = screenName.toLowerCase();
              console.log(user.providerData);
              if (screenName /*&& user.displayName !== screenName*/) {
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
    case "GET_LIST":
      subscribeToList(request.uid);
      sendResponse({ success: true });
      break;
    case "SIGN_OUT":
      unsubscribe && unsubscribe();
      unsubscribe = null;
      user = null;
      firebase
        .auth()
        .signOut()
        .then(() => sendResponse({ success: true }));
      sendMessageToPage({
        action: "UPDATE_USER",
        user: null
      });
      return true;
    default:
      return true;
  }
});
