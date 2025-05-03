import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TextField, Popper, Paper, List, ListItem, ListItemText, CircularProgress, Box, Typography } from '@mui/material';
import './MapSearchBar.css';
import { searchItems } from '../../services/firestoreService'; // Import the search function

const DEBOUNCE_DELAY = 300; // ms

const MapSearchBar = ({ onSearchResultSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [error, setError] = useState(null);
  // Placeholder state for future features
  const [favoritesData, setFavoritesData] = useState([]);
  const [claimedDealsData, setClaimedDealsData] = useState([]);

  const debounceTimeoutRef = useRef(null); // Ref to store timeout ID

  // Function to fetch suggestions from Firestore
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length <= 2) {
        setSuggestions([]);
        setIsLoading(false);
        setError(null);
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log(`Fetching suggestions for: ${query}`);
      const results = await searchItems(query);
      console.log('Search results:', results);
      setSuggestions(results || []); // Ensure results is always an array
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to fetch search results.");
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies needed as searchItems is imported

  const handleInputChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    setAnchorEl(event.currentTarget);
    setIsModalOpen(!!query); // Open modal if there's text

    // Clear previous debounce timer
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new debounce timer
    debounceTimeoutRef.current = setTimeout(() => {
      if (query.length > 2) { // Trigger search after 3 characters
         fetchSuggestions(query);
      } else {
         setSuggestions([]); // Clear suggestions if query is short
         setIsLoading(false);
         setError(null);
      }
    }, DEBOUNCE_DELAY);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleSelectSuggestion = (item) => {
    console.log("Selected:", item);
    setSearchQuery(item.name); // Optionally update input field
    setIsModalOpen(false);
    setSuggestions([]);
    if (onSearchResultSelect) {
      onSearchResultSelect(item);
    }
  };

  const handleFocus = (event) => {
    setAnchorEl(event.currentTarget);
    // Optionally open modal on focus, even if empty
    // setIsModalOpen(true);
     // Show suggestions if query is already long enough when focusing
     if (searchQuery.length > 2) {
        setIsModalOpen(true);
        // Optionally trigger fetch immediately or rely on existing suggestions
        if (!suggestions.length && !isLoading) {
             // fetchSuggestions(searchQuery); // Uncomment to fetch if suggestions are empty on focus
        }
     }
  };

  const handleBlur = (event) => {
    // Delay closing to allow clicks on suggestions
    setTimeout(() => {
      // Check if the related target (where focus went) is inside the Popper
      if (anchorEl && anchorEl.contains(event.relatedTarget)) {
         return; // Don't close if focus moved within the search bar/popper
      }
       // Check if the focus moved to an element within the popper itself
       const popperElement = document.querySelector('.map-search-popper');
       if (popperElement && popperElement.contains(event.relatedTarget)) {
            return; // Don't close if focus moved inside the suggestion list
       }

       setIsModalOpen(false); // Close if focus moved outside

    }, 150); // Slightly shorter delay might feel more responsive
   };

  // TODO: Implement functions to fetch favorites and claimed deals

  return (
    <Box className="map-search-container" sx={{ position: 'relative' }}> {/* Added relative positioning */} 
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search locations, vendors..."
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        InputProps={{
          startAdornment: (
            // Optional: Add a search icon
            // <InputAdornment position="start">
            //   <SearchIcon />
            // </InputAdornment>
            <></>
          ),
          endAdornment: isLoading ? <CircularProgress size={20} /> : null,
        }}
        sx={{ // Keep existing styles
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 1,
            '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(0, 0, 0, 0.23)', // Default border color
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(0, 0, 0, 0.87)', // Border color on hover
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main', // Border color when focused
                },
              },
        }}
      />
      <Popper
        open={isModalOpen}
        anchorEl={anchorEl}
        placement="bottom-start"
        className="map-search-popper"
        // Ensure Popper is positioned correctly relative to the container
        sx={{ position: 'absolute', zIndex: 1300, width: anchorEl ? anchorEl.clientWidth : 'auto' }}
      >
        <Paper elevation={3} sx={{ maxHeight: '400px', overflowY: 'auto' }}>
          {/* Section 1: Search Suggestions/Results */}
          {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
              </Box>
          )}
          {!isLoading && error && <Typography color="error" sx={{ p: 2 }}>{error}</Typography>}
          {!isLoading && !error && searchQuery.length > 2 && !suggestions.length && (
            <Typography sx={{ p: 2, color: 'text.secondary' }}>No results found for "{searchQuery}"</Typography>
          )}
          {!isLoading && !error && suggestions.length > 0 && (
            <List dense>
              <ListItem dense divider>
                 <ListItemText primary="Search Results" primaryTypographyProps={{ fontWeight: 'bold' }} />
              </ListItem>
              {suggestions.map((item) => (
                <ListItem button key={item.id} onClick={() => handleSelectSuggestion(item)}>
                  {/* TODO: Add Icon based on item type or logoUrl */}
                  <ListItemText primary={item.name} secondary={item.type || 'Location'} />
                   {/* TODO: Add location actions icon/button */}
                </ListItem>
              ))}
            </List>
          )}

          {/* Section 2: Favorites (Placeholder) */}
          {/* ... */}

          {/* Section 3: Claimed Deals (Placeholder) */}
          {/* ... */}

        </Paper>
      </Popper>
    </Box>
  );
};

export default MapSearchBar; 