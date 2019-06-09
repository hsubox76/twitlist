import firebase from "firebase/app";
import "firebase/firestore";

// export function getOtherLists(uid) {
//   const getCollection = firebase
//     .firestore()
//     .collection("lists")
//     .where("sharedWith", "array-contains", uid)
// }

export function subscribeToListsSharedWithUser(uid, onData) {
  return firebase
      .firestore()
      .collection("lists")
      .where("sharedWith", "array-contains", uid)
      .onSnapshot(snap => {
        const otherLists = [];
        snap.forEach(doc => {
          otherLists.push(doc.data())
        });
        onData(otherLists);
      })
}

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
  const method = isNew ? "set" : "update";
  return firebase
    .firestore()
    .collection("lists")
    .doc(uid)
    .collection("notes")
    .doc(screenname.toLowerCase())
    [method](
      Object.assign({}, updates, {
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      })
    );
}

export function removeSharee(listUid, shareeScreenname, shareeUid) {
  const updates = {
    [`sharedWithScreennames.${shareeScreenname}`]: firebase.firestore.FieldValue.delete()
  };
  if (shareeUid) {
    updates.sharedWith = firebase.firestore.FieldValue.arrayRemove(shareeUid)
  }
  const removeFromList = firebase.firestore().collection('lists').doc(listUid)
    .update(updates);
  const removeFromPendingShares = firebase.firestore().collection('pendingShares').doc(shareeScreenname).get()
    .then(doc => {
      if (doc.exists) {
        return doc.ref.update({
          sharedLists: firebase.firestore.FieldValue.arrayRemove(listUid)
        })
      }
    });
  return Promise.all([removeFromList, removeFromPendingShares]);
}

export function addSharee(uid, screenname) {
  return firebase
    .firestore()
    .collection("screenNames")
    .doc(screenname)
    .get()
    .then(screennameLookupDoc => {
      if (screennameLookupDoc.exists) {
        // Found account, add account's UID to this list's sharedWith array
        return firebase
          .firestore()
          .collection("lists")
          .doc(uid)
          .update({
            sharedWith: firebase.firestore.FieldValue.arrayUnion(
              screennameLookupDoc.data().uid
            ),
            [`sharedWithScreennames.${screenname}`]: screennameLookupDoc.data().uid
          });
      } else {
        // User has not created an account with us, no UID.
        const listPlaceholderAdd = firebase
          .firestore()
          .collection("lists")
          .doc(uid)
          .update({
            [`sharedWithScreennames.${screenname}`]: '_'
          });
        // Add screenname to a pendingShares collection that will be checked
        // whenever the user does create an account.
        const pendingAdd = firebase
          .firestore()
          .collection("pendingShares")
          .doc(screenname)
          .get()
          .then(pendingSharesDoc => {
            if (pendingSharesDoc.exists) {
              pendingSharesDoc.ref.update({
                sharedLists: firebase.firestore.FieldValue.arrayUnion(uid)
              });
            } else {
              pendingSharesDoc.ref.set({
                sharedLists: [uid]
              });
            }
          });
        return Promise.all([listPlaceholderAdd, pendingAdd]);
      }
    })
    .catch(e => {
      console.error(e);
    });
}
