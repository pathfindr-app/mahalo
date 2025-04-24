import { httpsCallable, getFunctions } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

/**
 * Cloud Functions Service
 * 
 * Provides client-side methods to interact with Firebase Cloud Functions
 * that handle deal analytics, real-time updates, and background processing
 */

// Initialize Firebase Functions
const functions = getFunctions();

/**
 * Get analytics for a specific deal
 * @param {string} dealId - The ID of the deal to get analytics for
 * @returns {Promise<Object>} Deal analytics data
 */
export const getDealAnalytics = async (dealId) => {
  try {
    // Ensure user is authenticated
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to view deal analytics');
    }
    
    // Call the Cloud Function
    const getDealAnalyticsFunc = httpsCallable(functions, 'getDealAnalytics');
    const result = await getDealAnalyticsFunc({ dealId });
    
    return result.data;
  } catch (error) {
    console.error('Error getting deal analytics:', error);
    throw error;
  }
};

/**
 * Request generation of a weekly analytics report
 * Admin users only
 * @returns {Promise<Object>} Generated report data
 */
export const generateWeeklyReport = async () => {
  try {
    // This would typically use a more secure approach in production
    // but for demonstration, we'll use a simple fetch request
    const auth = getAuth();
    const idToken = await auth.currentUser.getIdToken();
    
    const response = await fetch(
      `https://us-central1-mahalo-457020.cloudfunctions.net/generateWeeklyAnalytics`, 
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to generate weekly report: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating weekly report:', error);
    throw error;
  }
};

/**
 * Request cleanup of old notifications
 * Admin users only
 * @returns {Promise<Object>} Cleanup result data
 */
export const cleanupOldNotifications = async () => {
  try {
    const auth = getAuth();
    const idToken = await auth.currentUser.getIdToken();
    
    const response = await fetch(
      `https://us-central1-mahalo-457020.cloudfunctions.net/cleanupOldNotifications`, 
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to cleanup old notifications: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    throw error;
  }
};

/**
 * Get all unread notifications for the admin dashboard
 * @returns {Promise<Array>} Array of notification objects
 */
export const getAdminNotifications = async () => {
  try {
    // This would typically be a Cloud Function but for demonstration
    // we're directly accessing Firestore
    // In a production app, you should create a dedicated Cloud Function for this
    // to properly handle security and data filtering
    
    // Import needed here to avoid circular dependencies
    const { queryDocuments } = await import('./firestoreService');
    
    const notifications = await queryDocuments('Notifications', {
      fieldPath: 'read',
      operator: '==',
      value: false
    }, 'created', 'desc');
    
    return notifications;
  } catch (error) {
    console.error('Error getting admin notifications:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - The ID of the notification to mark as read
 * @returns {Promise<void>}
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    // Import needed here to avoid circular dependencies
    const { updateDocument } = await import('./firestoreService');
    
    await updateDocument('Notifications', notificationId, {
      read: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export default {
  getDealAnalytics,
  generateWeeklyReport,
  cleanupOldNotifications,
  getAdminNotifications,
  markNotificationAsRead
}; 