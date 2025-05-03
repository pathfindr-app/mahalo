import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types'; // Import PropTypes
import { queryItems } from '../../services/firestoreService.js'; // Adjust path as needed
import { 
  Button, 
  CircularProgress, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography,
  TextField,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  IconButton
} from '@mui/material'; // Using Material UI components
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import { ALL_TAGS, POI_TYPES } from '../../utils/constants.js';
// Remove useNavigate if it's no longer used directly for navigation within this component
// import { useNavigate } from 'react-router-dom'; 

// Import React Icons for display
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
// Add other sets if needed

// Combine the icons for lookup
const ICON_COMPONENTS = {
  ...FaIcons,
  ...MdIcons,
  // ... add other sets here
};

// Helper function to get the icon component by name (similar to MapContainer)
const getIconComponent = (iconName, size = 24) => { // Default size slightly larger for table
  if (!iconName || typeof iconName !== 'string') return null;
  const IconComponent = ICON_COMPONENTS[iconName]; 
  if (!IconComponent) {
      console.warn(`ItemList Icon component not found for name: ${iconName}.`);
      return null;
  }
  return IconComponent;
};

function ItemList({ onCreateNew, onEditItem }) { // Destructure props
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const navigate = useNavigate(); // Remove if not used

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [tagFilter, setTagFilter] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortDesc, setSortDesc] = useState(false);
  
  // Debounced search to avoid too many queries
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Update debouncedSearch after delay
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Define handlers
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
  };
  
  const handleTagFilterChange = (e) => {
    setTagFilter(e.target.value);
  };
  
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };
  
  const toggleSortDirection = () => {
    setSortDesc(!sortDesc);
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setTagFilter([]);
    setSortBy('name');
    setSortDesc(false);
  };

  const handleCreateNew = () => {
    // Call the handler passed via props
    onCreateNew();
  };

  const handleEditItem = (itemId) => {
    // Call the handler passed via props
    onEditItem(itemId);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Fetch items with current filters
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query options
      const options = {
        nameContains: debouncedSearch,
        sortBy,
        sortDesc
      };
      
      // Add type filter if selected
      if (typeFilter) {
        options.type = typeFilter;
      }
      
      // Add tag filter if selected
      if (tagFilter.length > 0) {
        options.tags = tagFilter;
      }
      
      const fetchedItems = await queryItems(options);
      setItems(fetchedItems);
    } catch (err) {  
      console.error("Error fetching items:", err);
      setError(err.message || 'Failed to load items.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter, tagFilter, sortBy, sortDesc]);

  // Fetch items when filters change
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (loading && items.length === 0) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  // Create list of common tags for filter dropdown
  const tagOptions = ALL_TAGS.slice(0, 20).map(tag => ({
    value: tag,
    label: tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }));

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6}>
          <Typography variant="h5">Manage Items</Typography>
        </Grid>
        <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" color="primary" onClick={handleCreateNew}>
            Create New Item
          </Button>
        </Grid>
      </Grid>
      
      {/* Search and Filter UI */}
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              label="Search by name or description"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                endAdornment: (
                  <SearchIcon color="action" />
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={8} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              startIcon={<FilterListIcon />} 
              onClick={toggleFilters}
              color="primary"
              variant={showFilters ? "contained" : "outlined"}
              sx={{ mr: 1 }}
              size="small"
            >
              Filters
            </Button>
            {(searchQuery || typeFilter || tagFilter.length > 0 || sortBy !== 'name' || sortDesc) && (
              <Button 
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                color="secondary"
                size="small"
              >
                Clear
              </Button>
            )}
          </Grid>
        </Grid>
        
        {/* Additional filters */}
        {showFilters && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="type-filter-label">Type</InputLabel>
                <Select
                  labelId="type-filter-label"
                  value={typeFilter}
                  label="Type"
                  onChange={handleTypeFilterChange}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value={POI_TYPES.VENDOR}>Vendor</MenuItem>
                  <MenuItem value={POI_TYPES.POI}>POI</MenuItem>
                  <MenuItem value={POI_TYPES.BEACH}>Beach</MenuItem>
                  <MenuItem value={POI_TYPES.RESTAURANT}>Restaurant</MenuItem>
                  <MenuItem value={POI_TYPES.ACTIVITY}>Activity</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={5}>
              <FormControl fullWidth size="small">
                <InputLabel id="tag-filter-label">Tags</InputLabel>
                <Select
                  labelId="tag-filter-label"
                  multiple
                  value={tagFilter}
                  onChange={handleTagFilterChange}
                  input={<OutlinedInput label="Tags" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value.replace(/-/g, ' ')} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {tagOptions.map((tag) => (
                    <MenuItem key={tag.value} value={tag.value}>
                      {tag.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              <Grid container spacing={1}>
                <Grid item xs={8}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="sort-label">Sort By</InputLabel>
                    <Select
                      labelId="sort-label"
                      value={sortBy}
                      label="Sort By"
                      onChange={handleSortChange}
                    >
                      <MenuItem value="name">Name</MenuItem>
                      <MenuItem value="type">Type</MenuItem>
                      <MenuItem value="status.lastUpdated">Last Updated</MenuItem>
                      <MenuItem value="status.createdAt">Created Date</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <Button 
                    variant="outlined" 
                    onClick={toggleSortDirection}
                    fullWidth
                    sx={{ height: '100%' }}
                    title={sortDesc ? "Descending order" : "Ascending order"}
                  >
                    {sortDesc ? "↓ DESC" : "↑ ASC"}
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}
      </Box>
      
      {/* Results and loading indicator */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" color="textSecondary">
          {items.length} {items.length === 1 ? 'item' : 'items'} found
        </Typography>
        {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
      </Box>
      
      <TableContainer>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '50px' }}>Icon</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Brief Description</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Actions</TableCell> 
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No items found.</TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                // Determine icon/logo to display
                let iconElement = null;
                if (item.presentation?.logoUrl) {
                  iconElement = (
                    <img 
                      src={item.presentation.logoUrl} 
                      alt={`${item.name} logo`} 
                      style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: '4px' }} 
                    />
                  );
                } else if (item.presentation?.icon) {
                  const IconComp = getIconComponent(item.presentation.icon);
                  if (IconComp) {
                    iconElement = <IconComp size={24} />;
                  }
                }
                // Add fallback for category/default icon here if needed in the future

                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={item.id}>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {iconElement || '-'}
                    </TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.description?.brief || 'N/A'}</TableCell>
                    <TableCell>
                      {item.tags && item.tags.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {item.tags.slice(0, 3).map((tag) => (
                            <Chip key={tag} label={tag.replace(/-/g, ' ')} size="small" />
                          ))}
                          {item.tags.length > 3 && (
                            <Chip label={`+${item.tags.length - 3}`} size="small" variant="outlined" />
                          )}
                        </Box>
                      ) : (
                        'No tags'
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        onClick={() => handleEditItem(item.id)}
                        sx={{ mr: 1 }}
                        variant="outlined"
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
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