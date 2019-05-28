const firebaseConfig = {
    apiKey: "AIzaSyDH6Z397_wbFkkyzHhJ5d1qPpyqgZKP34Y",
    authDomain: "twitlist-939a3.firebaseapp.com",
    databaseURL: "https://twitlist-939a3.firebaseio.com",
    projectId: "twitlist-939a3",
    storageBucket: "twitlist-939a3.appspot.com",
    messagingSenderId: "451811852932",
    appId: "1:451811852932:web:aac2b0e437f65015"
  };

firebase.initializeApp(firebaseConfig);

let globalUser = null;

firebase.auth().onAuthStateChanged(function(fetchedUser) {
  if (fetchedUser) {
    user = fetchedUser;
  } else {
    firebase.auth().signInWithPopup(provider);
  }
});

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    console.log('got request', request);
    if (request.need === 'user') {
      sendResponse({ user });
    }
    if (request.need === 'list') {
      firebase.firestore()
        .collection('lists')
        .doc(request.uid)
        .collection('notes')
        .get()
        .then(snap => {
          if (snap) {
            const knownUsers = {};
            snap.forEach(doc => knownUsers[doc.id] = doc.data());
            sendResponse({ knownUsers });
          } else {
            sendResponse({ error: 'did not get data' });
          }
        })
        .catch(e => console.error(e));
      return true;
    }
  }
)
