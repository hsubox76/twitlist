import { firebaseConfig } from '../../shared/firebase-config';

firebase.initializeApp(firebaseConfig);

let user = null;
const provider = new firebase.auth.TwitterAuthProvider();

firebase.auth().onAuthStateChanged(function(fetchedUser) {
  console.log('onAuthStateChanged: user = ', fetchedUser)
  if (fetchedUser) {
    user = fetchedUser;
  }
  // Change extension icon based on login state.
  // chrome.tabs.query({active:true, windowType:"normal", currentWindow: true},function(d){
  //   var tabId = d[0].id;
  //   chrome.browserAction.setIcon({path: 'images/icon1.png', tabId: tabId});
  // });
});

chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {hostContains: 'twitter.com'},
      })
      ],
          actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});

function fetchList(uid) {
  return firebase.firestore()
    .collection('lists')
    .doc(uid)
    .collection('notes')
    .get()
    .then(snap => {
      if (snap) {
        const knownUsers = {};
        snap.forEach(doc => knownUsers[doc.id] = doc.data());
        return({ knownUsers });
      } else {
        return({ error: 'did not get data' });
      }
    })
    .catch(e => console.error(e));
}

function sendMessageToPage(message) {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, message);
  })
}

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    console.log('got request', request);
    switch (request.action) {
      case 'GET_USER':
        sendResponse({ user });
        break;
      case 'SIGN_IN_USER':
        firebase.auth().signInWithPopup(provider).then(credential => {
          if (credential.user) {
            user = credential.user;
            // Get screenname if new user and set it as profile displayname
            if (credential.additionalUserInfo /* && credential.additionalUserInfo.isNewUser */) {
              console.log(credential.additionalUserInfo.profile);
              const screenName = credential.additionalUserInfo.profile['screen_name'];
              if (user.displayName !== screenName) {
                user.updateProfile({
                  displayName: screenName
                })
                .then(() => sendResponse({ user }));
              } else {
                sendResponse({ user });
              }
            }
            // Can finish asynchronously and send message when it gets
            // the data.
            fetchList(user.uid).then(response => {
              if (response.knownUsers) {
                sendMessageToPage({
                  action: 'RENDER_LIST',
                  knownUsers: response.knownUsers
                });
              }
            });
          } else {
            sendResponse({ error: 'could not get user' });
          }
        });
        return true;
      case 'GET_LIST':
        fetchList(request.uid).then(sendResponse);
        return true;
      case 'SIGN_OUT':
        firebase.auth().signOut().then(() => 
          sendResponse({ success: true })
        );
        sendMessageToPage({
          action: 'UPDATE_USER',
          user: null
        });
        return true;
      default:
        return true;
    }
  }
)
