const admin = require('firebase-admin');

// Initialize admin for the mahalorewardscard project
const mahalorewardscard = admin.initializeApp({
  credential: admin.credential.cert(require('./mahalorewardscard-firebase-adminsdk-fbsvc-b43e985619.json'))
}, 'mahalorewardscard');

// The user UID provided
const uid = 'vTjEcCh0lbWIM5DVdDvSSlxXvNU2';

console.log('Setting admin claim in mahalorewardscard project...');
mahalorewardscard.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log('Admin claim added successfully in mahalorewardscard project for UID:', uid);
    
    // Now get a service account key for the mahalo-457020 project and set it up
    console.log('Note: If this script errors after this point, you need to download the service account key for mahalo-457020 project');
    console.log('To do this, go to Firebase Console > Project Settings > Service accounts > Generate new private key');
    console.log('Save the file as mahalo-457020-firebase-adminsdk.json in this directory');
    
    try {
      // Try to initialize the second project if the file exists
      const mahalo457020 = admin.initializeApp({
        credential: admin.credential.cert(require('./mahalo-457020-firebase-adminsdk.json'))
      }, 'mahalo-457020');
      
      console.log('Setting admin claim in mahalo-457020 project...');
      return mahalo457020.auth().setCustomUserClaims(uid, { admin: true });
    } catch (error) {
      console.error('Error initializing mahalo-457020 project:', error.message);
      console.log('The admin claim was only set in mahalorewardscard project.');
      process.exit(0);
    }
  })
  .then(() => {
    console.log('Admin claim added successfully in mahalo-457020 project for UID:', uid);
    console.log('Admin claims have been set in both projects.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error adding admin claim:', error);
    process.exit(1);
  }); 