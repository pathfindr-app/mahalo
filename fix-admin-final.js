const admin = require('firebase-admin');

// Initialize admin for the mahalorewardscard project
const app = admin.initializeApp({
  credential: admin.credential.cert(require('./mahalorewardscard-firebase-adminsdk-fbsvc-b43e985619.json'))
});

// The user UID
const uid = 'vTjEcCh0lbWIM5DVdDvSSlxXvNU2';

// Force a specific project ID
const projectId = 'mahalorewardscard';

// Print debug info
console.log(`Setting admin claim for user ${uid} in project ${projectId}`);
console.log('Service account project ID:', require('./mahalorewardscard-firebase-adminsdk-fbsvc-b43e985619.json').project_id);

// Set the admin claim
admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`Admin claim successfully set for user ${uid} in project ${projectId}`);
    
    // Get the user to verify
    return admin.auth().getUser(uid);
  })
  .then((userRecord) => {
    console.log('User record:', userRecord.toJSON());
    console.log('Custom claims:', userRecord.customClaims);
    console.log('\nIMPORTANT: Sign out and sign back in to your application to refresh your token.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error setting admin claim:', error);
    process.exit(1);
  }); 