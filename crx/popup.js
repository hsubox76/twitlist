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

let changeColor = document.getElementById('changeColor');
const provider = new firebase.auth.TwitterAuthProvider();

  chrome.storage.sync.get('color', function(data) {
    changeColor.style.backgroundColor = data.color;
    changeColor.setAttribute('value', data.color);
  });
  // User triggered event.
  changeColor.onclick = function(element) {
    firebase.auth().signInWithPopup(provider);
  };