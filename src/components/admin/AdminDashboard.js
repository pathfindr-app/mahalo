import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  Box, 
  Typography,
  Modal,
  IconButton,
  Icon,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../context/AuthContext.js';
import { auth } from '../../services/firebase.js';
import ItemList from './ItemList.js';
import ItemForm from '../items/ItemForm.js';
import DealList from './DealList.js';
import DealForm from './DealForm.js';
import NotificationsComponent from './NotificationsComponent.js';
import DealAnalytics from './DealAnalytics.js';
import './AdminDashboard.css';

function AdminDashboard() {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecking, setAdminChecking] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingDealId, setEditingDealId] = useState(null);
  const [selectedDealForAnalytics, setSelectedDealForAnalytics] = useState(null);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      setAdminChecking(true);
      try {
        // Get the *real* current user from the auth instance
        const user = auth.currentUser;
        if (user) {
          // Get the ID token result from the actual user object
          const idTokenResult = await user.getIdTokenResult(true); // Force refresh
          console.log("Checking admin status in AdminDashboard. Claims:", idTokenResult.claims); // Add log
          setIsAdmin(!!idTokenResult.claims.admin);
        } else {
          console.log("No user found in AdminDashboard check."); // Add log
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setAdminChecking(false);
      }
    };

    checkAdminStatus();
    // Depend on currentUser from context only to re-trigger the check when login state changes
  }, [currentUser]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCreateNewItem = () => {
    setEditingItemId(null);
    setModalContent('create-item');
    setModalOpen(true);
  };

  const handleEditItem = (itemId) => {
    setEditingItemId(itemId);
    setModalContent('edit-item');
    setModalOpen(true);
  };

  const handleCreateNewDeal = () => {
    setEditingDealId(null);
    setModalContent('create-deal');
    setModalOpen(true);
  };

  const handleEditDeal = (dealId) => {
    setEditingDealId(dealId);
    setModalContent('edit-deal');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setModalContent(null);
    setEditingItemId(null);
    setEditingDealId(null);
  };

  const handleSubmissionSuccess = () => {
    handleCloseModal();
    // Refresh data as needed
  };

  const showDealAnalytics = (dealId) => {
    setSelectedDealForAnalytics(dealId);
    setModalContent('deal-analytics');
    setModalOpen(true);
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '1200px',
    maxHeight: '90vh',
    overflow: 'auto',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  };

  if (adminChecking) {
    return (
      <Container maxWidth="xl" className="admin-dashboard">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Checking permissions...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="xl" className="admin-dashboard">
        <Alert severity="error" sx={{ mt: 4 }}>
          You don't have permission to access the admin dashboard. Please log in with an admin account.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className="admin-dashboard">
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="admin dashboard tabs">
          <Tab label="Items" />
          <Tab label="Analytics" />
          <Tab label="Deals" />
        </Tabs>
      </Box>

      {/* Items Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <ItemList 
                onCreateNew={handleCreateNewItem}
                onEditItem={handleEditItem}
              />
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Analytics Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Analytics Dashboard</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Select a deal from the Deals tab to view detailed analytics.
              </Typography>
              {/* More analytics components can be added here */}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <NotificationsComponent />
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Deals Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <DealList 
                onCreateNew={handleCreateNewDeal}
                onEditDeal={handleEditDeal}
              />
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Modal for Various Forms/Content */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="modal-title"
        keepMounted
      >
        <Box sx={modalStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography id="modal-title" variant="h6" component="h2">
              {modalContent === 'create-item' && 'Create New Item'}
              {modalContent === 'edit-item' && 'Edit Item'}
              {modalContent === 'create-deal' && 'Create New Deal'}
              {modalContent === 'edit-deal' && 'Edit Deal'}
              {modalContent === 'deal-analytics' && 'Deal Analytics'}
            </Typography>
            <IconButton onClick={handleCloseModal} size="small">
              <Icon>close</Icon>
            </IconButton>
          </Box>

          {/* Item Form */}
          {(modalContent === 'create-item' || modalContent === 'edit-item') && (
            <ItemForm
              itemId={editingItemId}
              onSubmissionSuccess={handleSubmissionSuccess}
              onCancel={handleCloseModal}
            />
          )}

          {/* Deal Form */}
          {(modalContent === 'create-deal' || modalContent === 'edit-deal') && (
            <DealForm
              dealId={editingDealId}
              onSubmissionSuccess={handleSubmissionSuccess}
              onCancel={handleCloseModal}
            />
          )}

          {/* Deal Analytics */}
          {modalContent === 'deal-analytics' && (
            <DealAnalytics dealId={selectedDealForAnalytics} />
          )}
        </Box>
      </Modal>
    </Container>
  );
}

export default AdminDashboard; 