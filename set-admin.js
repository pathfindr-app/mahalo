const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // The file you downloaded

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const email = 'pathfindr.game@gmail.com'; // Your email

async function setAdminClaim() {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    console.log('Found user:', user.uid);
    
    // Set admin claim
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Successfully set admin claim for ${email}`);
    
    // Verify the claim was set
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log('Updated user claims:', updatedUser.customClaims);
  } catch (error) {
    console.error('Error:', error);
  }
}

setAdminClaim(); 