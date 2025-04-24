const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// HTTP function to set admin claims for specific users
// This should be deployed once, used, then deleted for security
exports.setupInitialAdmin = functions.https.onRequest(async (req, res) => {
  // Check for authorization - should have a secret key for additional security
  const authKey = req.query.key;
  if (authKey !== 'setup-mahalo-admin') {
    res.status(403).send('Unauthorized access');
    return;
  }

  // Email of the user to make admin - this should be your login email
  const adminEmail = 'pathfindr.game@gmail.com'; // Replace with your actual email
  
  try {
    // Get the user by email
    const userRecord = await admin.auth().getUserByEmail(adminEmail);
    
    // Set custom claim
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    
    // Send success response
    res.status(200).send(`Success! User ${adminEmail} is now an admin. Please sign out and sign back in to apply changes. DELETE THIS FUNCTION IMMEDIATELY AFTER USE.`);
  } catch (error) {
    console.error('Error setting admin claim:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
}); 