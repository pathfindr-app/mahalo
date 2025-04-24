const admin = require('firebase-admin');
const serviceAccount = require('./mahalorewardscard-firebase-adminsdk-fbsvc-b43e985619.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// The user UID provided
const uid = 'vTjEcCh0lbWIM5DVdDvSSlxXvNU2';

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log('Admin claim added successfully for UID:', uid);
    process.exit();
  })
  .catch(error => {
    console.error('Error adding admin claim:', error);
    process.exit(1);
  }); 