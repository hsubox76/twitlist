const functions = require('firebase-functions');
const admin = require('firebase-admin');
const request = require('request');

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

exports.onNewUser = functions.auth.user().onCreate(user => {
  const tid = user.providerData[0].uid;
  return getTwitterUser(user.providerData[0].uid)
    .then((tUser) => {
      const screenName = tUser.screen_name;
      const userWrite = admin.firestore()
        .collection('users')
        .doc(user.uid)
        .set({
          tid,
          screenName: screenName
        });
      const screenNameWrite = admin.firestore()
        .collection('screenNames')
        .doc(screenName)
        .set({
          uid: user.uid,
          tid
        });
      return Promise.all([userWrite, screenNameWrite]);
    })
    .catch(e => {
      console.error(e);
    });
});