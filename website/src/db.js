import firebase from "firebase/app";
import "firebase/firestore";
import { COLL, VISIBILITY } from "../../shared/constants";

export function getRef(collectionOrPath, doc) {
  const pathParts = collectionOrPath.split("/");
  if (pathParts.length % 2 === 0) {
    // document
    if (doc) {
      return firebase
        .firestore()
        .collection(collectionOrPath)
        .doc(doc);
    } else {
      return firebase.firestore().doc(collectionOrPath);
    }
  } else {
    // collection
    if (doc) {
      return firebase
        .firestore()
        .collection(collectionOrPath)
        .doc(doc);
    }
    return firebase.firestore().collection(collectionOrPath);
  }
}

export function subscribeToListsSharedWithUser(uid, onData) {
  return getRef(COLL.LISTS)
    .where("visibility", "==", VISIBILITY.SHARED)
    .where("sharedWith", "array-contains", uid)
    .onSnapshot(snap => {
      const otherLists = [];
      snap.forEach(doc => {
        otherLists.push(Object.assign({ creatorUid: doc.id }, doc.data()));
      });
      onData(otherLists);
    });
}

export function subscribeToPublicListsSharedWithUser(uid, onData) {
  return getRef(COLL.LISTS)
    .where("visibility", "==", VISIBILITY.PUBLIC)
    .where("sharedWith", "array-contains", uid)
    .onSnapshot(snap => {
      const otherLists = [];
      snap.forEach(doc => {
        otherLists.push(Object.assign({ creatorUid: doc.id }, doc.data()));
      });
      onData(otherLists);
    });
}

export async function getGuestList(uid, listUid) {
  let properties = {};
  try {
    properties = await getListProperties(listUid);
  } catch (e) {
    if (e.message.includes("insufficient permissions")) {
      return { error: "permissions" };
    } else {
      throw e;
    }
  }
  let notes;
  if (properties.visibility === VISIBILITY.PUBLIC) {
    notes = await getListNotes(listUid);
  } else if (properties.visibility === VISIBILITY.SHARED && properties.sharedWith.includes(uid)) {
    notes = await getListNotes(listUid, initialQuery => {
      return initialQuery.where("visibility", "==", VISIBILITY.SHARED);
    });
  }
  return { list: notes || [], listProperties: properties };
}

export function getListProperties(uid) {
  return getRef(COLL.LISTS, uid)
    .get()
    .then(function handleListPropsSnapshot(snap) {
      if (snap) {
        return snap.data();
      } else {
        throw new Error("Could not get list properties.");
      }
    })
    .catch(e => {
      throw new Error(`Error getting ${COLL.LISTS}/${uid}: ${e.message}`);
    });
}

export function updateListProperties(uid, updates) {
  return getRef(COLL.LISTS, uid)
    .update(updates)
    .catch(e => {
      throw new Error(`Error updating ${COLL.LISTS}/${uid}: ${e.message}`);
    });
}

export function getListNotes(uid, filterFn) {
  let getNotesQuery = getRef(`${COLL.LISTS}/${uid}/${COLL.NOTES}`);
  console.log('getnotesquery', getNotesQuery);
  if (filterFn) {
    getNotesQuery = filterFn(getNotesQuery);
  }

  return getNotesQuery
    .get()
    .then(function handleListSnapshot(snap) {
      if (snap) {
        const tempList = [];
        snap.forEach(doc =>
          tempList.push(Object.assign({ screenname: doc.id }, doc.data()))
        );
        return tempList;
      } else {
        throw new Error("Could not get notes.");
      }
    })
    .catch(e => {
      throw new Error(
        `Error getting ${COLL.LISTS}/${uid}/${COLL.NOTES}: ${e.message}`
      );
    });
}

export function getList(uid, filterFn) {
  const getCollection = getListNotes(uid, filterFn);
  const getProperties = getListProperties(uid);
  return Promise.all([getCollection, getProperties])
    .then(([list = [], listProperties = {}]) => {
      return { list, listProperties };
    })
    .catch(e => console.error(e));
}

export function updateNote(uid, screenname, updates, isNew = true) {
  const method = isNew ? "set" : "update";
  return getRef(`${COLL.LISTS}/${uid}/${COLL.NOTES}`)
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
    updates.sharedWith = firebase.firestore.FieldValue.arrayRemove(shareeUid);
  }
  const removeFromList = getRef(COLL.LISTS, listUid)
    .update(updates)
    .catch(e => {
      throw new Error("Could not remove " + listUid + " from list");
    });
  const removeFromPendingShares = getRef(COLL.PENDING_SHARES)
    .get()
    .then(doc => {
      if (doc.exists) {
        return doc.ref.update({
          sharedLists: firebase.firestore.FieldValue.arrayRemove(listUid)
        });
      }
    })
    .catch(e => {
      throw new Error("Could not update pendingShares");
    });
  return Promise.all([removeFromList, removeFromPendingShares]);
}

export function addSharee(uid, screenname) {
  return getRef(COLL.SCREEN_NAMES, screenname)
    .get()
    .then(screennameLookupDoc => {
      if (screennameLookupDoc.exists) {
        // Found account, add account's UID to this list's sharedWith array
        return getRef(COLL.LISTS, uid)
          .update({
            sharedWith: firebase.firestore.FieldValue.arrayUnion(
              screennameLookupDoc.data().uid
            ),
            [`sharedWithScreennames.${screenname}`]: screennameLookupDoc.data()
              .uid
          })
          .catch(e => {
            throw new Error(
              `Could not add ` +
                `${screenname}:${screennameLookupDoc.data().uid} to ${
                  COLL.LISTS
                }/${uid}`
            );
          });
      } else {
        // User has not created an account with us, no UID.
        const listPlaceholderAdd = getRef(COLL.LISTS, uid)
          .update({
            [`sharedWithScreennames.${screenname}`]: "_"
          })
          .catch(e => {
            throw new Error(
              `Could not add ${screenname}:_ to ${COLL.LISTS}/${uid}`
            );
          });
        // Add screenname to a pendingShares collection that will be checked
        // whenever the user does create an account.
        const pendingAdd = getRef(COLL.PENDING_SHARES, screenname)
          .get()
          .then(pendingSharesDoc => {
            if (pendingSharesDoc.exists) {
              pendingSharesDoc.ref
                .update({
                  sharedLists: firebase.firestore.FieldValue.arrayUnion(uid)
                })
                .catch(e => {
                  throw new Error(
                    `Could not add ${uid} to ${COLL.PENDING_SHARES}/${screenname}`
                  );
                });
            } else {
              pendingSharesDoc.ref
                .set({
                  sharedLists: [uid]
                })
                .catch(e => {
                  throw new Error(
                    `Could not create ${COLL.PENDING_SHARES}/${screenname}`
                  );
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
