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

export function updateNote(uid, screenname, updates, isNew = true) {
  const method = isNew ? 'set' : 'update';
  return firebase
    .firestore()
    .collection("lists")
    .doc(uid)
    .collection("notes")
    .doc(screenname.toLowerCase())
    [method](Object.assign({}, updates, {
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }));
}
