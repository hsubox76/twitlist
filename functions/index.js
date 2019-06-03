const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
exports.onNewUser = functions.auth.user().onCreate(user => {
  admin.firestore().collection('userTest').doc(user.uid).set({ tid: user.providerData[0].uid });
});