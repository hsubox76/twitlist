import { COLL, VISIBILITY } from "../../shared/constants";
import { firebaseConfig } from "../../shared/firebase-config";

let firebase;

export async function getFirebase() {
  if (firebase) return firebase;
  const importPromises = [
    import(/* webpackChunkName: "app" */ "firebase/app"),
    import(/* webpackChunkName: "auth" */ "firebase/auth"),
    import(/* webpackChunkName: "firestore" */ "firebase/firestore"),
    import(/* webpackChunkName: "analytics" */ "firebase/analytics"),
    import(/* webpackChunkName: "performance" */ "firebase/performance")
  ];
  return await Promise.all(importPromises).then(([firebaseApp]) => {
    firebase = firebaseApp;
    firebaseApp.initializeApp(firebaseConfig);
    firebaseApp.analytics();
    firebaseApp.performance();
    return firebaseApp;
  });
}

export async function getRef(collectionOrPath, doc) {
  await getFirebase();
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

export async function subscribeToListsSharedWithUser(uid, onData) {
  const ref = await getRef(COLL.LISTS);
  return ref
    .where("visibility", "==", VISIBILITY.SHARED)
    .where("sharedWith", "array-contains", uid)
    .onSnapshot(snap => {
      const otherLists = [];
      snap.forEach(doc => {
        otherLists.push(Object.assign({ creatorUid: doc.id }, doc.data()));
      });
      onData(otherLists);
    }, err => { console.error(err) });
}

export async function subscribeToPublicListsSharedWithUser(uid, onData) {
  const ref = await getRef(COLL.LISTS);
  return ref
    .where("visibility", "==", VISIBILITY.PUBLIC)
    .where("sharedWith", "array-contains", uid)
    .onSnapshot(snap => {
      const otherLists = [];
      snap.forEach(doc => {
        otherLists.push(Object.assign({ creatorUid: doc.id }, doc.data()));
      });
      onData(otherLists);
    }, err => { console.error(err) });
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
  } else if (
    properties.visibility === VISIBILITY.SHARED &&
    uid &&
    properties.sharedWith.includes(uid)
  ) {
    notes = await getListNotes(listUid);
    // TODO: Put this back if we restore individual note visibility
    // notes = await getListNotes(listUid, initialQuery => {
    //   return initialQuery.where("visibility", "==", VISIBILITY.SHARED);
    // });
  }
  return { list: notes || [], listProperties: properties };
}

export async function getListProperties(uid) {
  const ref = await getRef(COLL.LISTS, uid);
  return ref
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

export async function updateListProperties(uid, updates) {
  const ref = await getRef(COLL.LISTS, uid);
  return ref.update(updates).catch(e => {
    throw new Error(`Error updating ${COLL.LISTS}/${uid}: ${e.message}`);
  });
}

export async function getListNotes(uid, filterFn) {
  let getNotesQuery = await getRef(`${COLL.LISTS}/${uid}/${COLL.NOTES}`);
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

export async function getList(uid, filterFn) {
  const getCollection = getListNotes(uid, filterFn);
  const getProperties = getListProperties(uid);
  return Promise.all([getCollection, getProperties])
    .then(([list = [], listProperties = {}]) => {
      return { list, listProperties };
    })
    .catch(e => console.error(e));
}

export async function deleteNote(uid, screenname) {
  const ref = await getRef(`${COLL.LISTS}/${uid}/${COLL.NOTES}`);
  return ref.doc(screenname.toLowerCase()).delete();
}

export async function updateNote(uid, screenname, updates, isNew = true) {
  const method = isNew ? "set" : "update";
  const ref = await getRef(`${COLL.LISTS}/${uid}/${COLL.NOTES}`);
  return ref
    .doc(screenname.toLowerCase())
    [method](
      Object.assign({}, updates, {
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      })
    );
}

export async function removeSharee(listUid, shareeScreenname, shareeUid) {
  await getFirebase();
  const updates = {
    [`sharedWithScreennames.${shareeScreenname}`]: firebase.firestore.FieldValue.delete()
  };
  if (shareeUid) {
    updates.sharedWith = firebase.firestore.FieldValue.arrayRemove(shareeUid);
  }
  const removeFromList = await getRef(COLL.LISTS, listUid)
    .update(updates)
    .catch(e => {
      throw new Error("Could not remove " + listUid + " from list");
    });
  const removeFromPendingShares = await getRef(COLL.PENDING_SHARES)
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

export async function addSharee(uid, screenname) {
  let screennameFinal = screenname;
  if (screenname && screenname[0] === "@") {
    screennameFinal = screenname.slice(1);
  }
  const ref = await getRef(COLL.SCREEN_NAMES, screennameFinal);
  return ref
    .get()
    .then(async screennameLookupDoc => {
      if (screennameLookupDoc.exists) {
        // Found account, add account's UID to this list's sharedWith array
        const ref = await getRef(COLL.LISTS, uid);
        return ref
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
        const listPlaceholderAdd = await getRef(COLL.LISTS, uid)
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
        const pendingAdd = await getRef(COLL.PENDING_SHARES, screenname)
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

export function logInToFirebase(renderer) {
  return getFirebase().then(firebase => {
    const provider = new firebase.auth.TwitterAuthProvider();
    firebase
      .auth()
      .signInWithPopup(provider)
      .then(credential => {
        if (credential.user) {
          // Get screenname if new user and set it as profile displayname
          if (credential.additionalUserInfo) {
            let screenName =
              credential.additionalUserInfo.profile["screen_name"];
            screenName = screenName.toLowerCase();
            if (screenName && credential.user.displayName !== screenName) {
              credential.user
                .updateProfile({
                  displayName: screenName
                })
                .then(() => renderer.setState({ user: credential.user }));
            } else {
              renderer.setState({ user: credential.user });
            }
          }
        } else {
          // TODO: log error
        }
      })
      .catch(e => {
        console.error(e);
      });
  });
}