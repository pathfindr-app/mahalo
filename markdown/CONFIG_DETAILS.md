# MAHALO App Configuration Details

This file documents the essential configuration details for connecting the MAHALO app to Firebase and Google Cloud services.

## Firebase Configuration (`MahaloRewardsCard` Project)

-   **Project Name:** `MahaloRewardsCard`
-   **Project ID:** `mahalorewardscard`
-   **Web API Key:** `AIzaSyAYReyOsNfW8Zsa1cUKFGSQOEnylDc_yNk`
-   **Auth Domain:** `mahalorewardscard.firebaseapp.com`
-   **Storage Bucket:** `mahalorewardscard.firebasestorage.app`
-   **Messaging Sender ID:** `550890960598`
-   **App ID:** `1:550890960598:web:a1b0f5655500e58ae2fb77`
-   **Measurement ID:** `G-ZF9GE5B0Z1`

## Google Cloud Configuration (`mahalo-457020` Project)

-   **Project ID:** `mahalo-457020` (This project is implicitly linked to the Firebase project `MahaloRewardsCard`)

### OAuth 2.0 Client ID (`MAHALO Web App`)

-   **Application Type:** Web application
-   **Client ID Name:** `MAHALO Web App`
-   **Authorized JavaScript Origins:**
    -   `http://localhost:3000`
    -   `http://localhost`
-   **Authorized Redirect URI:**
    -   `https://mahalorewardscard.firebaseapp.com/__/auth/handler`

## Project Configuration Issues (Resolved 2024-04-24)

-   **IMPORTANT:** Use `mahalorewardscard` as the Firebase project ID for all operations
-   The Firebase CLI might sometimes be configured to use `mahalo-457020` - confirm with `firebase use`
-   If deploying Firestore rules or functions, always verify the target project with `firebase use mahalorewardscard`
-   Admin claims must be set specifically on the `mahalorewardscard` project
-   After any service account operations or admin claim changes, users must sign out and sign back in to refresh their token

## Notes

-   Ensure the `firebaseConfig` object in `src/services/firebase.js` matches the Firebase Configuration details above.
-   Ensure the OAuth 2.0 Client ID settings in the Google Cloud Console match the details listed here.
-   For admin operations, use the service account key from `mahalorewardscard` project, not `mahalo-457020` 