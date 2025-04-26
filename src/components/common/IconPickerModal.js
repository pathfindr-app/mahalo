import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  IconButton,
  Grid,
  Box,
  Tooltip,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Import specific icon sets you want to offer
// Starting with Font Awesome (fa) and Material Design (md)
// Add more imports (e.g., from 'react-icons/hi', 'react-icons/fi', etc.) as needed
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
// Example: import * as HiIcons from 'react-icons/hi';

const ICON_SETS = {
  ...FaIcons,
  ...MdIcons,
  // ...HiIcons,
};

// Create a list of available icons with their names and components
// We compute this once
const AVAILABLE_ICONS = Object.entries(ICON_SETS)
  .map(([name, component]) => ({ name, component }))
  .filter(icon => typeof icon.component === 'function'); // Filter out non-component exports


function IconPickerModal({ open, onClose, onIconSelect }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIcons = useMemo(() => {
    if (!searchTerm) {
      // Optionally limit initial display or show nothing until search
      return AVAILABLE_ICONS.slice(0, 100); // Limit initial load for performance
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return AVAILABLE_ICONS.filter(icon =>
      icon.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [searchTerm]);

  const handleIconClick = (iconName) => {
    onIconSelect(iconName); // Pass the string identifier (e.g., "FaBeer")
    onClose(); // Close the modal after selection
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Select Icon
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          variant="outlined"
          label="Search Icons"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />
        {filteredIcons.length === 0 && searchTerm && (
            <Typography>No icons found for "{searchTerm}"</Typography>
        )}
        <Grid container spacing={1} sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {filteredIcons.map(({ name, component: IconComponent }) => (
            <Grid item key={name} xs={2} sm={1} md={1} sx={{ textAlign: 'center' }}>
              <Tooltip title={name}>
                <IconButton onClick={() => handleIconClick(name)} size="large">
                  <IconComponent />
                </IconButton>
              </Tooltip>
            </Grid>
          ))}
           {/* Display a message if many icons are hidden without search */}
           {!searchTerm && AVAILABLE_ICONS.length > 100 && (
             <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">
                    Showing first 100 icons. Use search to find more.
                </Typography>
             </Grid>
           )}
        </Grid>
      </DialogContent>
    </Dialog>
  );
}

IconPickerModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onIconSelect: PropTypes.func.isRequired,
};

export default IconPickerModal; 