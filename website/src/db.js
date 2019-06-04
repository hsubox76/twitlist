import firebase from "firebase/app";
import "firebase/firestore";

export function getList(uid) {
  const getCollection = firebase
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
        throw new Error("Could not get list collection.");
      }
    });
  const getProperties = firebase
    .firestore()
    .collection("lists")
    .doc(uid)
    .get()
    .then(function handleListPropsSnapshot(snap) {
      if (snap) {
        return snap.data();
      } else {
        throw new Error("Could not get list properties.");
      }
    });
  return Promise.all([getCollection, getProperties])
    .then(([list = [], listProperties = {}]) => {
      return { list, listProperties };
    })
    .catch(e => console.error(e));
}

export function postNewNote({ user }, renderer) {
  if (!user.uid) return;
  const description = getValueAtId("user-description");
  const screenname = getValueAtId("user-screen-name");
  const twitterId = getValueAtId("user-twitter-id");
  if (!description || !screenname) return;
  const userAddButton = document.getElementById("user-add-submit");
  const userDescription = document.getElementById("user-description");
  userAddButton.setAttribute("disabled", true);
  userDescription.setAttribute("disabled", true);
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
      // window.history.pushState({}, "", "/");
      renderer.setState({ params: {} });
      getList(user.uid).then(({ list, listProperties }) =>
        renderer.setState({ list, listProperties })
      );
    })
    .catch(function onFailedPost(e) {
      console.error(e);
      userAddButton.setAttribute("disabled", false);
      userDescription.setAttribute("disabled", false);
    });
}
