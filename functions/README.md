# MAHALO Firebase Cloud Functions

This directory contains Cloud Functions for Firebase used in the MAHALO application to handle:
- Analytics for deal tracking
- Real-time updates
- Background processing

## Functions Overview

### Deal Analytics Functions

1. **trackDealClaim**
   - Trigger: `onDocumentCreated("Deals/{dealId}/claims/{claimId}")`
   - Description: Tracks when a deal is claimed, increments analytics counters, and updates peak usage times.
   - Updates deal document with current claimed count and claim history
   - Uses a transaction to safely update peak usage analytics

2. **checkDealExpiration**
   - Trigger: `onDocumentUpdated("Deals/{dealId}")`
   - Description: Automatically checks and updates deal status when it expires or reaches maximum claims.
   - Checks end date against current time
   - Checks current claim count against maximum allowed claims

### Real-time Update Functions

1. **getDealAnalytics**
   - Trigger: `onCall` (callable function)
   - Description: Provides real-time analytics data for a specific deal.
   - Can be called from client applications with authentication
   - Returns formatted analytics data including total available, claimed, claim rate, and peak times

2. **createDealNotification**
   - Trigger: `onDocumentWritten("Deals/{dealId}")`
   - Description: Generates notifications when deals are about to expire or reach maximum claims.
   - Creates expiration notification when a deal is within 24 hours of expiring
   - Creates claims limit notification when a deal reaches 90% of maximum claims

### Background Processing Functions

1. **generateWeeklyAnalytics**
   - Trigger: `onRequest` (HTTP triggered)
   - Description: Generates weekly analytics reports for all deals.
   - Gets all deals and calculates summary statistics
   - Stores reports in the AnalyticsReports collection
   - Can be converted to scheduled function

2. **cleanupOldNotifications**
   - Trigger: `onRequest` (HTTP triggered)
   - Description: Removes notifications older than 30 days to maintain database performance.
   - Uses batched writes for efficient deletion
   - Can be converted to scheduled function

## Development

### Local Testing

1. Run the Firebase emulator:
```
npm run serve
```

2. Test HTTP functions using curl or Postman against:
```
http://localhost:5001/mahalo-457020/us-central1/generateWeeklyAnalytics
http://localhost:5001/mahalo-457020/us-central1/cleanupOldNotifications
```

### Deployment

Deploy all functions:
```
npm run deploy
```

Deploy a specific function:
```
firebase deploy --only functions:trackDealClaim
```

## Security Considerations

- All functions that modify data require Firebase authentication
- Callable functions validate user authentication before proceeding
- Background functions are protected by Firebase Function default security

## Future Enhancements

1. Convert HTTP functions to scheduled functions using Cloud Scheduler
2. Add more detailed analytics for user engagement
3. Implement email/push notifications for admin alerts 