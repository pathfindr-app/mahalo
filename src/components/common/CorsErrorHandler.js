import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, Button, Collapse, Box, Link } from '@mui/material';

/**
 * Global CORS error handler component that displays a helpful message when CORS errors occur
 * This component monitors the console for CORS errors and shows a helpful alert
 */
const CorsErrorHandler = () => {
  const [corsError, setCorsError] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // Original console.error
    const originalConsoleError = console.error;

    // Override console.error to detect CORS errors
    console.error = (...args) => {
      // Call original console.error
      originalConsoleError.apply(console, args);

      // Check if any of the arguments contain CORS error messages
      const errorString = args.join(' ');
      if (
        errorString.includes('CORS policy') ||
        errorString.includes('blocked by CORS') ||
        errorString.includes('storage/cors-error') ||
        errorString.includes('XMLHttpRequest') && errorString.includes('firebasestorage')
      ) {
        setCorsError(true);
      }
    };

    // Cleanup - restore original console.error
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  if (!corsError) return null;

  return (
    <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, maxWidth: 500 }}>
      <Collapse in={open}>
        <Alert 
          severity="warning" 
          onClose={() => setOpen(false)}
          sx={{ 
            boxShadow: 3,
            '& .MuiAlert-message': { maxWidth: '100%' }
          }}
        >
          <AlertTitle>Firebase Storage CORS Error</AlertTitle>
          <p>
            We've detected a CORS error when accessing Firebase Storage.
            This is likely preventing image uploads from working correctly.
          </p>
          <p><strong>Possible solutions:</strong></p>
          <ol>
            <li>
              Check the Firebase Storage configuration in <code>firebase.js</code>. The correct value for 
              <code>storageBucket</code> should be <code>"projectId.appspot.com"</code>
            </li>
            <li>
              Configure Firebase Storage CORS settings by creating a <code>cors.json</code> file and running:<br />
              <code>gsutil cors set cors.json gs://projectId.appspot.com</code>
            </li>
            <li>
              Verify that your Firebase project has Storage rules that allow read/write access from your domain
            </li>
          </ol>
          <Box sx={{ mt: 2 }}>
            <Link 
              href="https://firebase.google.com/docs/storage/web/download-files#cors_configuration" 
              target="_blank"
              rel="noopener"
              sx={{ mr: 2 }}
            >
              Firebase CORS Docs
            </Link>
            <Button 
              onClick={() => setCorsError(false)} 
              size="small" 
              variant="outlined"
              sx={{ ml: 2 }}
            >
              Dismiss
            </Button>
          </Box>
        </Alert>
      </Collapse>
    </Box>
  );
};

export default CorsErrorHandler; 