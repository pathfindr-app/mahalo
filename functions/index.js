/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const {onCall} = require("firebase-functions/v2/https");
const {onDocumentCreated, onDocumentUpdated, onDocumentWritten} = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Initialize the Firebase Admin SDK
admin.initializeApp();

// Reference to Firestore database
const db = admin.firestore();

/**
 * Deal Analytics Functions
 */

// Track deal claims and update analytics when a new claim is created
exports.trackDealClaim = onDocumentCreated("Deals/{dealId}/claims/{claimId}", async (event) => {
  const claimData = event.data.data();
  const dealId = event.params.dealId;
  const userId = claimData.userId;
  const timestamp = claimData.timestamp || admin.firestore.FieldValue.serverTimestamp();

  try {
    // Update the deal document with new analytics data
    await db.collection("Deals").doc(dealId).update({
      "analytics.currentlyClaimed": admin.firestore.FieldValue.increment(1),
      "analytics.claimHistory": admin.firestore.FieldValue.arrayUnion({
        timestamp,
        userId,
      }),
    });

    logger.info(`Deal claim tracked for deal ${dealId} by user ${userId}`, {
      dealId,
      userId,
      timestamp,
    });

    // Update peak times analytics (using a transaction to ensure consistency)
    const dealRef = db.collection("Deals").doc(dealId);
    await db.runTransaction(async (transaction) => {
      const dealDoc = await transaction.get(dealRef);
      if (!dealDoc.exists) {
        throw new Error("Deal does not exist");
      }

      const dealData = dealDoc.data();
      const date = new Date(timestamp.toDate ? timestamp.toDate() : timestamp);
      const dayOfWeek = date.getDay(); // 0-6, where 0 is Sunday
      const hour = date.getHours(); // 0-23
      const timeOfDay = `${hour.toString().padStart(2, "0")}:00`;

      // Find if we already have an entry for this day and time
      const peakTimes = dealData.analytics && dealData.analytics.peakTimes ? dealData.analytics.peakTimes : [];
      const existingPeakIndex = peakTimes.findIndex(
          (peak) => peak.dayOfWeek === dayOfWeek && peak.timeOfDay === timeOfDay
      );

      if (existingPeakIndex >= 0) {
        // Update existing peak time entry
        peakTimes[existingPeakIndex].claimCount += 1;
      } else {
        // Create new peak time entry
        peakTimes.push({
          dayOfWeek,
          timeOfDay,
          claimCount: 1,
        });
      }

      // Update the document with new peak times data
      transaction.update(dealRef, {
        "analytics.peakTimes": peakTimes,
      });
    });

    return {success: true};
  } catch (error) {
    logger.error("Error tracking deal claim", error);
    throw error;
  }
});

// Check for deal expiration and update status
exports.checkDealExpiration = onDocumentUpdated("Deals/{dealId}", async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();
  const dealId = event.params.dealId;

  // Skip if deal is already inactive or if this is a status update
  if (!afterData.status.isActive || 
      beforeData.status.isActive !== afterData.status.isActive) {
    return null;
  }

  try {
    const now = admin.firestore.Timestamp.now();
    
    // Check if deal has expired
    if (afterData.validity.endDate && afterData.validity.endDate.toMillis() < now.toMillis()) {
      // Update deal status to inactive
      await db.collection("Deals").doc(dealId).update({
        "status.isActive": false,
        "status.lastUpdated": now,
      });
      
      logger.info(`Deal ${dealId} automatically marked as inactive due to expiration`);
    }
    
    // Check if deal has reached maximum claims
    if (afterData.limits.maxClaims && 
        afterData.analytics.currentlyClaimed >= afterData.limits.maxClaims) {
      // Update deal status to inactive
      await db.collection("Deals").doc(dealId).update({
        "status.isActive": false,
        "status.lastUpdated": now,
      });
      
      logger.info(`Deal ${dealId} automatically marked as inactive due to reaching maximum claims`);
    }
    
    return {success: true};
  } catch (error) {
    logger.error(`Error checking deal expiration for ${dealId}`, error);
    throw error;
  }
});

/**
 * Real-time Update Functions
 */

// Callable function to get analytics for a specific deal
exports.getDealAnalytics = onCall(async (request) => {
  // Ensure user is authenticated
  if (!request.auth) {
    throw new Error("Unauthorized");
  }
  
  const dealId = request.data.dealId;
  if (!dealId) {
    throw new Error("Deal ID is required");
  }
  
  try {
    const dealDoc = await db.collection("Deals").doc(dealId).get();
    if (!dealDoc.exists) {
      throw new Error("Deal not found");
    }
    
    const dealData = dealDoc.data();
    
    // Return analytics data only
    return {
      totalAvailable: dealData.limits.maxClaims || 0,
      currentlyClaimed: dealData.analytics.currentlyClaimed || 0,
      claimRate: dealData.analytics.currentlyClaimed / dealData.limits.maxClaims || 0,
      peakTimes: dealData.analytics.peakTimes || [],
      isActive: dealData.status.isActive,
    };
  } catch (error) {
    logger.error(`Error getting analytics for deal ${dealId}`, error);
    throw new Error(`Failed to retrieve analytics: ${error.message}`);
  }
});

// Create notification when deal is close to expiration or reaching max claims
exports.createDealNotification = onDocumentWritten("Deals/{dealId}", async (event) => {
  const data = event.data.after.data();
  const dealId = event.params.dealId;
  
  if (!data || !data.status.isActive) {
    return null;
  }
  
  try {
    const now = admin.firestore.Timestamp.now();
    const notificationRef = db.collection("Notifications");
    
    // Check for approaching expiration (within 24 hours)
    if (data.validity.endDate) {
      const timeUntilExpiration = data.validity.endDate.toMillis() - now.toMillis();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      
      if (timeUntilExpiration > 0 && timeUntilExpiration < oneDayInMs) {
        // Create expiration notification
        await notificationRef.add({
          type: "deal_expiration",
          dealId: dealId,
          dealTitle: data.title,
          expirationTime: data.validity.endDate,
          created: now,
          read: false,
          priority: "medium",
        });
        
        logger.info(`Created expiration notification for deal ${dealId}`);
      }
    }
    
    // Check for approaching maximum claims (90% full)
    if (data.limits.maxClaims && data.analytics.currentlyClaimed) {
      const claimPercentage = (data.analytics.currentlyClaimed / data.limits.maxClaims) * 100;
      
      if (claimPercentage >= 90) {
        // Create maximum claims approaching notification
        await notificationRef.add({
          type: "deal_claims_limit",
          dealId: dealId,
          dealTitle: data.title,
          claimsPercentage: claimPercentage,
          currentClaims: data.analytics.currentlyClaimed,
          maxClaims: data.limits.maxClaims,
          created: now,
          read: false,
          priority: "high",
        });
        
        logger.info(`Created claims limit notification for deal ${dealId}`);
      }
    }
    
    return {success: true};
  } catch (error) {
    logger.error(`Error creating notification for deal ${dealId}`, error);
    throw error;
  }
});

/**
 * Background Processing Functions
 */

// Generate weekly deal analytics report
exports.generateWeeklyAnalytics = onRequest(async (req, res) => {
  // This would typically be scheduled, but we're using HTTP trigger for simplicity
  // You can convert this to a scheduled function with:
  // exports.generateWeeklyAnalytics = functions.pubsub.schedule('every monday 00:00').onRun(async (context) => {
  try {
    const dealsSnapshot = await db.collection("Deals").get();
    
    // Create a report object to store analytics
    const report = {
      generatedAt: admin.firestore.Timestamp.now(),
      totalDeals: dealsSnapshot.size,
      activeDeals: 0,
      totalClaims: 0,
      dealsByPopularity: [],
      weeklyStats: {
        newDeals: 0,
        newClaims: 0,
        expiredDeals: 0,
      },
    };
    
    // Process each deal
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoTimestamp = admin.firestore.Timestamp.fromDate(oneWeekAgo);
    
    // Collect deals data
    dealsSnapshot.forEach((doc) => {
      const dealData = doc.data();
      
      // Count active deals
      if (dealData.status.isActive) {
        report.activeDeals++;
      }
      
      // Add to total claims
      const claimCount = dealData.analytics.currentlyClaimed || 0;
      report.totalClaims += claimCount;
      
      // Add to deals by popularity
      report.dealsByPopularity.push({
        dealId: doc.id,
        title: dealData.title,
        claimCount: claimCount,
        claimRate: dealData.limits.maxClaims ? claimCount / dealData.limits.maxClaims : 0,
      });
      
      // Check if deal was created in the last week
      if (dealData.status.createdAt && 
          dealData.status.createdAt.toMillis() >= oneWeekAgoTimestamp.toMillis()) {
        report.weeklyStats.newDeals++;
      }
      
      // Check if deal expired in the last week
      if (!dealData.status.isActive && 
          dealData.status.lastUpdated && 
          dealData.status.lastUpdated.toMillis() >= oneWeekAgoTimestamp.toMillis()) {
        report.weeklyStats.expiredDeals++;
      }
    });
    
    // Sort deals by popularity
    report.dealsByPopularity.sort((a, b) => b.claimCount - a.claimCount);
    
    // Get new claims in the last week
    const claimsQuery = await db.collectionGroup("claims")
        .where("timestamp", ">=", oneWeekAgoTimestamp)
        .get();
        
    report.weeklyStats.newClaims = claimsQuery.size;
    
    // Store the report in Firestore
    await db.collection("AnalyticsReports").add(report);
    
    logger.info("Weekly analytics report generated successfully");
    res.status(200).send({success: true, report});
  } catch (error) {
    logger.error("Error generating weekly analytics report", error);
    res.status(500).send({error: error.message});
  }
});

// Cleanup old notifications
exports.cleanupOldNotifications = onRequest(async (req, res) => {
  try {
    // Get notifications older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);
    
    const oldNotificationsQuery = await db.collection("Notifications")
        .where("created", "<", cutoffTimestamp)
        .get();
    
    if (oldNotificationsQuery.empty) {
      logger.info("No old notifications to clean up");
      res.status(200).send({success: true, deletedCount: 0});
      return;
    }
    
    // Delete old notifications in batches
    const batch = db.batch();
    let deletedCount = 0;
    
    oldNotificationsQuery.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });
    
    await batch.commit();
    
    logger.info(`Deleted ${deletedCount} old notifications`);
    res.status(200).send({success: true, deletedCount});
  } catch (error) {
    logger.error("Error cleaning up old notifications", error);
    res.status(500).send({error: error.message});
  }
});
