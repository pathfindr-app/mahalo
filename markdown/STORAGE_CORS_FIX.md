# Storage CORS Configuration Fix

## Problem
Image uploads from the web application (running on origins like `http://localhost:3003`) to Firebase Storage are failing with CORS (Cross-Origin Resource Sharing) errors. The browser console shows errors like "Response to preflight request doesn't pass access control check: It does not have HTTP ok status." or "Access to fetch... has been blocked by CORS policy".

## Cause
Firebase Storage (which uses Google Cloud Storage buckets) requires an explicit CORS configuration to allow web applications hosted on different domains (origins) to make requests (like POST/PUT for uploads) to the storage bucket. The existing CORS configuration on the `gs://mahalorewardscard.appspot.com` bucket does not include the current development origin (`http://localhost:3003`).

## Current `cors.json` (`markdown/cors.json`)
```json
[
  {
    "origin": ["http://localhost:3001", "https://mahalorewardscard.web.app", "https://mahalorewardscard.firebaseapp.com"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Content-Length", "Content-Encoding", "Content-Disposition"]
  }
]
```

## Required Steps

1.  **Install/Configure Google Cloud SDK:** Ensure the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) is installed and the `gsutil` command is accessible in the system's PATH.
2.  **Update `cors.json`:** Modify the `markdown/cors.json` file to include the necessary development origin (`http://localhost:3003`) and potentially the `OPTIONS` method for preflight requests. The updated file should look like this:
    ```json
    [
      {
        "origin": [
          "http://localhost:3001",
          "http://localhost:3003",
          "https://mahalorewardscard.web.app",
          "https://mahalorewardscard.firebaseapp.com"
        ],
        "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
        "maxAgeSeconds": 3600,
        "responseHeader": ["Content-Type", "Content-Length", "Content-Encoding", "Content-Disposition", "Access-Control-Allow-Origin"]
      }
    ]
    ```
3.  **Authenticate with Google Cloud:** Ensure you are logged into the correct Google Cloud account using `gcloud auth login`.
4.  **Apply Updated CORS Configuration:** Run the following command from the `markdown` directory (or adjust path to `cors.json` accordingly):
    ```bash
    gsutil cors set cors.json gs://mahalorewardscard.appspot.com
    ```
5.  **Test:** Clear browser cache/perform a hard refresh and attempt the image upload again.

## Related Documentation
- [`markdown/CONFIG_DETAILS.md`](./CONFIG_DETAILS.md)
- [`markdown/FIREBASE_IMPLEMENTATION.md`](./FIREBASE_IMPLEMENTATION.md)
- [`markdown/PROJECT_PLAN.md`](./PROJECT_PLAN.md) 