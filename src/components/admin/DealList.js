import React, { useState, useEffect, useRef } from 'react';
import { 
  Typography, 
  Paper, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { queryDeals, deleteDeal } from '../../services/firestoreService';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext.js';
import './DealList.css';

/**
 * Component for listing and managing deals
 */
const DealList = ({ onCreateNew, onEditDeal }) => {
  const { currentUser } = useAuth();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const isMountedRef = useRef(true);

  // Load deals on component mount or when user changes
  useEffect(() => {
    isMountedRef.current = true;

    if (currentUser) {
      loadDeals();
    } else {
      if (isMountedRef.current) {
        setError('You need to be logged in to access deals.');
        setLoading(false);
      }
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [currentUser]);

  // Filter deals whenever the search term or deals list changes
  useEffect(() => {
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = deals.filter(deal => 
        deal.title.toLowerCase().includes(lowercaseSearch) ||
        deal.description.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredDeals(filtered);
    } else {
      setFilteredDeals(deals);
    }
  }, [searchTerm, deals]);

  // Load deals from Firestore
  const loadDeals = async () => {
    try {
      if (isMountedRef.current) setLoading(true);
      const dealsData = await queryDeals({
        sortBy: 'validity.startDate',
        sortDesc: true
      });
      if (isMountedRef.current) {
        setDeals(dealsData);
        setError(null);
      }
    } catch (err) {
      console.error('Error loading deals:', err);
      if (isMountedRef.current) {
        if (err.message && err.message.includes('permission')) {
          setError('You do not have permission to access deals. Please make sure you are logged in with an admin account.');
        } else {
          setError('Failed to load deals. Please try again.');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleDeleteClick = (deal) => {
    setDealToDelete(deal);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!dealToDelete) return;
    
    const currentDealId = dealToDelete.id;

    try {
      if (isMountedRef.current) setDeleteLoading(true);
      await deleteDeal(currentDealId);
      if (isMountedRef.current) {
        setDeals(prevDeals => prevDeals.filter(d => d.id !== currentDealId));
        setDeleteDialogOpen(false);
        setDealToDelete(null);
        setError(null);
      }
    } catch (err) {
      console.error('Error deleting deal:', err);
      if (isMountedRef.current) {
        setError('Failed to delete deal. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setDeleteLoading(false);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDealToDelete(null);
  };

  // Format date for display
  const formatDisplayDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    // Handle both Firestore timestamps and regular Date objects
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    
    return format(date, 'MMM d, yyyy');
  };

  // Get deal status text and color
  const getDealStatus = (deal) => {
    if (!deal.status?.isActive) {
      return { text: 'Inactive', color: 'error' };
    }
    
    const now = new Date();
    const endDate = deal.validity?.endDate?.toDate ? 
                    deal.validity.endDate.toDate() : 
                    new Date(deal.validity?.endDate);
    
    if (endDate < now) {
      return { text: 'Expired', color: 'warning' };
    }
    
    if (deal.analytics?.currentlyClaimed >= deal.limits?.maxClaims) {
      return { text: 'Fully Claimed', color: 'info' };
    }
    
    return { text: 'Active', color: 'success' };
  };

  return (
    <div className="deal-list-container">
      <Box className="deal-list-header">
        <Typography variant="h5" component="h2">
          Deals Management
        </Typography>
        <Button 
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateNew}
        >
          New Deal
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box className="deal-list-actions">
        <TextField
          placeholder="Search deals..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {loading ? (
        <Box className="deal-list-loading">
          <CircularProgress />
          <Typography>Loading deals...</Typography>
        </Box>
      ) : filteredDeals.length === 0 ? (
        <Box className="deal-list-empty">
          <Typography>
            {searchTerm ? 'No deals match your search.' : 'No deals created yet.'}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} className="deal-list-table">
          <Table aria-label="deals table">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Validity</TableCell>
                <TableCell>Claims</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDeals.map((deal) => {
                const status = getDealStatus(deal);
                
                return (
                  <TableRow key={deal.id}>
                    <TableCell>{deal.title}</TableCell>
                    <TableCell>{deal.vendorName || 'Unknown'}</TableCell>
                    <TableCell>
                      {deal.validity?.startDate && (
                        <>
                          {formatDisplayDate(deal.validity.startDate)} - 
                          {formatDisplayDate(deal.validity.endDate)}
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      {deal.analytics?.currentlyClaimed ?? 0} / {deal.limits?.maxClaims ?? 0}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={status.text} 
                        color={status.color} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => onEditDeal(deal.id)}
                        aria-label="edit"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(deal)}
                        aria-label="delete"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the deal "{dealToDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteCancel} 
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            disabled={deleteLoading}
            variant="contained"
            startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DealList; 