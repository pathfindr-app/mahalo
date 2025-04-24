import React, { useEffect, useState } from 'react';
import { getAuth, getIdTokenResult } from 'firebase/auth';
import { Box, Typography, Paper, Button } from '@mui/material';

const AdminCheck = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecking, setAdminChecking] = useState(true);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      setAdminChecking(true);
      try {
        const auth = getAuth();
        if (!auth.currentUser) {
          setError('Not authenticated');
          setAdminChecking(false);
          return;
        }
        
        const idTokenResult = await getIdTokenResult(auth.currentUser, true);
        console.log('Token claims:', idTokenResult.claims);
        setTokenInfo(idTokenResult.claims);
        setIsAdmin(!!idTokenResult.claims.admin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setError(error.message);
      } finally {
        setAdminChecking(false);
      }
    };
    
    checkAdminStatus();
  }, []);
  
  const handleForceRefresh = async () => {
    try {
      const auth = getAuth();
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      setError(error.message);
    }
  };
  
  if (adminChecking) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px',
        }}
      >
        <Typography>Checking admin status...</Typography>
      </Box>
    );
  }
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        padding: 3, 
        margin: 2,
        maxWidth: '600px',
        mx: 'auto',
      }}
    >
      <Typography variant="h5" gutterBottom>Admin Status Check</Typography>
      
      {error && (
        <Typography 
          color="error" 
          sx={{ mb: 2 }}
        >
          Error: {error}
        </Typography>
      )}
      
      <Typography 
        variant="h6" 
        color={isAdmin ? 'success.main' : 'error.main'}
        sx={{ mb: 2 }}
      >
        {isAdmin ? '✅ You have admin privileges' : '❌ You do NOT have admin privileges'}
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom>
        User ID: {getAuth().currentUser?.uid || 'Not authenticated'}
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom>
        Email: {getAuth().currentUser?.email || 'Not authenticated'}
      </Typography>
      
      {tokenInfo && (
        <Box sx={{ mt: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Token Claims:</Typography>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '4px',
            overflowX: 'auto'
          }}>
            {JSON.stringify(tokenInfo, null, 2)}
          </pre>
        </Box>
      )}
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleForceRefresh}
        sx={{ mt: 2 }}
      >
        Force Token Refresh
      </Button>
    </Paper>
  );
};

export default AdminCheck; 