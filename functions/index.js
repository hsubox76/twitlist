const functions = require('firebase-functions');
const admin = require('firebase-admin');
const request = require('request');
const { COLL, VISIBILITY } = require('./constants');

admin.initializeApp();
admin.firestore().settings({ timestampsInSnapshots: true });

function getTwitterUser(tid) {
  return new Promise((resolve, reject) => {
    const options = {
      url: `https://api.twitter.com/1.1/users/show.json?user_id=${tid}`,
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${functions.config().twitter.token}`
      }
    };
    function onResponse(err, res, body) {
      if (err) {
        reject(err);
      } else {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch(parseError) {
          reject(parseError);
        }
      }
    }
    request(options, onResponse);
  });
}

exports.onNewUser = functions.auth.user().onCreate(async user => {
  const tid = user.providerData[0].uid;
  let tUser = null;
  try {
    tUser = await getTwitterUser(user.providerData[0].uid);
  } catch (e) {
    console.error(e);
  }
  const screenName = tUser.screen_name;
  const userWrite = admin.firestore()
    .collection(COLL.USERS)
    .doc(user.uid)
    .set({
      tid,
      screenName: screenName
    });
  const screenNameWrite = admin.firestore()
    .collection(COLL.SCREEN_NAMES)
    .doc(screenName)
    .set({
      uid: user.uid,
      tid
    });
  const listPropsWrite = admin.firestore()
    .collection(COLL.LISTS)
    .doc(user.uid)
    .set({
      creatorScreenname: screenName,
      visibility: VISIBILITY.PRIVATE
    });
  const pendingSharesDoc = await admin.firestore()
    .collection(COLL.PENDING_SHARES)
    .doc(screenName)
    .get();
  if (pendingSharesDoc.exists) {
    // loop through list IDs in pending share list and write to their sharedWith arrays
    const listUpdates = pendingSharesDoc.data().sharedLists.map(listId => {
      return admin.firestore().collection('lists').doc(listId).update({
        sharedWith: admin.firestore.FieldValue.arrayUnion(user.uid),
        [`sharedWithScreennames.${screenName}`]: user.uid
      })
    });
    await Promise.all(listUpdates);
    await pendingSharesDoc.ref.delete();
  }
  await Promise.all([userWrite, screenNameWrite, listPropsWrite]);
});