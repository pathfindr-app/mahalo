import React, { useState } from 'react';
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
  Icon
} from '@mui/material';
import ItemList from './ItemList.js';
import ItemForm from '../items/ItemForm.js';
import './AdminDashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCreateNew = () => {
    setEditingItemId(null);
    setModalContent('create');
    setModalOpen(true);
  };

  const handleEditItem = (itemId) => {
    setEditingItemId(itemId);
    setModalContent('edit');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setModalContent(null);
    setEditingItemId(null);
  };

  const handleSubmissionSuccess = () => {
    handleCloseModal();
    // You might want to refresh the item list here
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
                onCreateNew={handleCreateNew}
                onEditItem={handleEditItem}
              />
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Analytics Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Analytics Dashboard</Typography>
              <Typography>Coming soon...</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Deals Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Deals Management</Typography>
              <Typography>Coming soon...</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Modal for Create/Edit Item Form */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="modal-title"
      >
        <Box sx={modalStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography id="modal-title" variant="h6" component="h2">
              {modalContent === 'create' ? 'Create New Item' : 'Edit Item'}
            </Typography>
            <IconButton onClick={handleCloseModal} size="small">
              <Icon>close</Icon>
            </IconButton>
          </Box>
          <ItemForm
            itemId={editingItemId}
            onSubmissionSuccess={handleSubmissionSuccess}
            onCancel={handleCloseModal}
          />
        </Box>
      </Modal>
    </Container>
  );
}

export default AdminDashboard; 