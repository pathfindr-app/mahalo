const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// HTTP function to set admin claims for a user
// Secured with function-level security
exports.setAdminUser = functions.https.onCall(async (data, context) => {
  // Check if the request is made by an existing admin
  if (!(context.auth && context.auth.token && context.auth.token.admin === true)) {
    // Only allow this operation if there are no admin users yet
    const adminQuery = await admin.auth().listUsers(1, undefined, {
      customClaims: { admin: true }
    });
    
    if (adminQuery.users.length > 0) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can add other admins'
      );
    }
  }

  // Get the user ID to promote to admin
  const { uid, email } = data;
  
  // If UID is provided, use it directly
  if (uid) {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    return { success: true, message: `User ${uid} is now an admin` };
  }
  
  // If email is provided, look up the user by email
  if (email) {
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
      return { success: true, message: `User ${email} is now an admin` };
    } catch (error) {
      throw new functions.https.HttpsError('not-found', `User with email ${email} not found`);
    }
  }
  
  throw new functions.https.HttpsError('invalid-argument', 'Either uid or email must be provided');
});

// HTTP function to check current user's admin status
exports.checkAdminStatus = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  try {
    // Get fresh user data to check claims
    const userRecord = await admin.auth().getUser(context.auth.uid);
    const customClaims = userRecord.customClaims || {};
    
    return {
      isAdmin: !!customClaims.admin,
      email: userRecord.email,
      uid: userRecord.uid
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Error checking admin status');
  }
}); 