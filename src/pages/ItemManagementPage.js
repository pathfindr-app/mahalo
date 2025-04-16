import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Snackbar, Alert } from '@mui/material';
import ItemForm from '../components/items/ItemForm.js';
import './ItemManagementPage.css';

function ItemManagementPage() {
  const navigate = useNavigate();
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleSubmit = async (formData) => {
    try {
      // Form submission is handled in ItemForm component
      setNotification({
        open: true,
        message: 'Item created successfully!',
        severity: 'success'
      });
      
      // Navigate to items list after a short delay
      setTimeout(() => {
        navigate('/admin/items');
      }, 2000);
    } catch (error) {
      setNotification({
        open: true,
        message: 'Failed to create item. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') return;
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <div className="item-management-page">
      <h1>Item Management</h1>
      <p>Create or edit items (POIs and Vendors) for the Mahalo app.</p>
      <ItemForm onSubmit={handleSubmit} />
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default ItemManagementPage; 