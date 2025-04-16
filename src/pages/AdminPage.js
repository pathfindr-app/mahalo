import React, { useState } from 'react';
import ItemList from '../components/admin/ItemList'; // Correct path for ItemList
import ItemForm from '../components/items/ItemForm'; // Corrected path for ItemForm
import { Container, Typography } from '@mui/material';

function AdminPage() {
  // State to manage view: 'list', 'create', 'edit'
  const [viewMode, setViewMode] = useState('list'); 
  // State to hold the ID of the item being edited
  const [editingItemId, setEditingItemId] = useState(null);

  // Handlers to switch views
  const showListView = () => {
    setViewMode('list');
    setEditingItemId(null);
  };

  const showCreateForm = () => {
    setViewMode('create');
    setEditingItemId(null);
  };

  const showEditForm = (itemId) => {
    setEditingItemId(itemId);
    setViewMode('edit');
  };

  return (
    <Container className="admin-page" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Item Management
      </Typography>

      {/* Conditionally render List or Form based on viewMode */}
      {viewMode === 'list' && (
        <ItemList 
          onCreateNew={showCreateForm} 
          onEditItem={showEditForm} 
        />
      )}

      {(viewMode === 'create' || viewMode === 'edit') && (
        <ItemForm 
          itemId={editingItemId} // Pass null for create, ID for edit
          onSubmissionSuccess={showListView} // Go back to list after successful save
          onCancel={showListView} // Go back to list if user cancels
        />
      )}

      {/* Other Admin sections (Deals, Analytics) can be added here later */}
    </Container>
  );
}

export default AdminPage; 