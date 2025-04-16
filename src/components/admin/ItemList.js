import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // Import PropTypes
import { queryItems } from '../../services/firestoreService.js'; // Adjust path as needed
import { Button, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'; // Using Material UI components
// Remove useNavigate if it's no longer used directly for navigation within this component
// import { useNavigate } from 'react-router-dom'; 

function ItemList({ onCreateNew, onEditItem }) { // Destructure props
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const navigate = useNavigate(); // Remove if not used

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedItems = await queryItems();
        setItems(fetchedItems);
      } catch (err) {  
        console.error("Error fetching items:", err);
        setError(err.message || 'Failed to load items.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleCreateNew = () => {
    // Call the handler passed via props
    onCreateNew();
  };

  const handleEditItem = (itemId) => {
    // Call the handler passed via props
    onEditItem(itemId);
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h5" gutterBottom>Manage Items</Typography>
      <Button variant="contained" color="primary" onClick={handleCreateNew} sx={{ mb: 2 }}>
        Create New Item
      </Button>
      <TableContainer>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Brief Description</TableCell>
              <TableCell>Actions</TableCell> 
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">No items found.</TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow hover role="checkbox" tabIndex={-1} key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.description?.brief || 'N/A'}</TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      onClick={() => handleEditItem(item.id)} // Pass item.id
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    {/* Add Delete button later */}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

// Add PropTypes for type checking
ItemList.propTypes = {
  onCreateNew: PropTypes.func.isRequired,
  onEditItem: PropTypes.func.isRequired,
};

export default ItemList; 