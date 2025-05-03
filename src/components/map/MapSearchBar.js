import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TextField, Popper, Paper, List, ListItem, ListItemButton, ListItemText, CircularProgress, Box, Typography } from '@mui/material';
import { debounce } from 'lodash';
import './MapSearchBar.css';
// No longer importing searchItems from firestoreService

// Haversine formula to calculate distance between two points on Earth
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Convert km to miles
function kmToMiles(km) {
    return km * 0.621371;
}

const MapSearchBar = ({ onSearchResultSelect, userLocation, allItems }) => { // Accept allItems prop
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [error, setError] = useState(null);
  // Add state to track the currently highlighted suggestion
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  // Placeholder state for future features
  const [favoritesData, setFavoritesData] = useState([]);
  const [claimedDealsData, setClaimedDealsData] = useState([]);

  const debounceTimeoutRef = useRef(null);

  // Ref for the main container/anchor element
  const searchContainerRef = useRef(null);
  // Ref for the list container to scroll to highlighted items
  const listRef = useRef(null);

  // --- Client-side search logic ---
  const performClientSearch = useCallback((term) => {
    // Set loading true immediately if term is valid, BEFORE checking allItems
    if (term.length >= 2) {
        setIsLoading(true);
        setError(null); // Clear previous error
        setSuggestions([]); // Clear previous suggestions
    } else {
        // This case shouldn't typically be hit if called correctly, but good practice.
        setIsLoading(false);
        setError(null);
        setSuggestions([]);
        return;
    }

    // Log the items received from the parent
    console.log('[MapSearchBar] Received allItems:', allItems);

    // Now check if we can actually search
    if (!allItems || allItems.length === 0) { // Removed term.length check here
      console.log('[MapSearchBar] Skipping search: No items available yet.');
      setIsLoading(false); // Stop loading indicator
      // setError("Waiting for item data..."); // Optional: could inform user
      setSuggestions([]); // Ensure suggestions are clear
      return;
    }

    // If we reach here, term is valid AND allItems exist. isLoading is already true.
    console.log(`[MapSearchBar] Performing client search for: "${term}"`);
    console.log('[MapSearchBar] User location for distance calc:', userLocation);

    const lowerCaseTerm = term.toLowerCase();
    const resultsMap = new Map();

    allItems.forEach((item, index) => {
      const itemName = item.name || '';
      const itemTags = item.tags || [];
      const itemNameLower = itemName.toLowerCase();
      // Ensure tags are strings and handle potential null/undefined values within the array before lowercasing
      const itemTagsLower = itemTags.map(tag => String(tag || '').toLowerCase()); 

      // --- DETAILED LOGGING FOR "surf" vs "surfing" --- 
      if (itemNameLower.includes('test') || itemTagsLower.some(t => t.includes('surf'))) {
          console.log(`[MapSearchBar Debug] Checking potentially relevant item: ${itemName}`);
          console.log(`  -> Search Term: "${lowerCaseTerm}"`);
          console.log(`  -> Item Name Lower: "${itemNameLower}"`);
          console.log(`  -> Item Tags Lower: [${itemTagsLower.join(', ')}]`);
          const nameMatch = itemNameLower.includes(lowerCaseTerm);
          const tagMatch = itemTagsLower.some(tag => tag.startsWith(lowerCaseTerm));
          console.log(`  -> Calculated Name Match: ${nameMatch}`);
          console.log(`  -> Calculated Tag Match (startsWith): ${tagMatch}`);
          if (nameMatch || tagMatch) {
              console.log(`  ===> MATCH CONFIRMED for ${item.name}`);
          } else {
              console.log(`  ===> NO MATCH for ${item.name}`);
          }
      }
      // --- END DETAILED LOGGING --- 

      // Use startsWith for name match for consistency with Firestore prefix query
      const nameMatch = itemNameLower.startsWith(lowerCaseTerm); 
      const tagMatch = itemTagsLower.some(tag => tag.startsWith(lowerCaseTerm));

      if ((nameMatch || tagMatch) && !resultsMap.has(item.id)) {
          console.log(`[MapSearchBar] Match found for "${term}": ${item.name} (ID: ${item.id})`);
          
          // Calculate distance
          let distanceKm = null;
          let distanceMiles = null;
          const itemCoords = item.location?.coordinates;

          if (userLocation?.lat && userLocation?.lng && itemCoords?.lat && itemCoords?.lng) {
            try {
                const userLatNum = Number(userLocation.lat);
                const userLngNum = Number(userLocation.lng);
                const itemLatNum = Number(itemCoords.lat);
                const itemLngNum = Number(itemCoords.lng);

                if (!isNaN(userLatNum) && !isNaN(userLngNum) && !isNaN(itemLatNum) && !isNaN(itemLngNum)) {
                    distanceKm = getDistanceFromLatLonInKm(userLatNum, userLngNum, itemLatNum, itemLngNum);
                    distanceMiles = kmToMiles(distanceKm);
                    console.log(`  -> [MapSearchBar] Distance calculated for ${item.name}: ${distanceMiles?.toFixed(2)} miles`);
                } else {
                    console.warn(`  -> [MapSearchBar] Invalid coordinates for distance calc: User(${userLatNum}, ${userLngNum}), Item(${itemLatNum}, ${itemLngNum})`);
                    distanceMiles = null;
                }
            } catch (e) {
                console.error(`  -> [MapSearchBar] Error calculating distance for ${item.name}:`, e);
                distanceMiles = null;
            }
          } else {
            console.log(`  -> [MapSearchBar] Skipping distance calc for ${item.name}: User Location(${userLocation?.lat}, ${userLocation?.lng}), Item Coords(${itemCoords?.lat}, ${itemCoords?.lng})`);
          }

          resultsMap.set(item.id, { 
              ...item, 
              distanceKm, 
              distanceMiles
          });
      }
    });

    let combinedResults = Array.from(resultsMap.values());
    console.log('[MapSearchBar] Raw combined results before sort:', combinedResults);

    // Sort results
    if (userLocation?.lat && userLocation?.lng) {
      combinedResults.sort((a, b) => {
        if (a.distanceMiles === null && b.distanceMiles === null) return (a.name || '').localeCompare(b.name || '');
        if (a.distanceMiles === null) return 1;
        if (b.distanceMiles === null) return -1;
        return a.distanceMiles - b.distanceMiles;
      });
    } else {
      combinedResults.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    console.log('[MapSearchBar] Final sorted suggestions:', combinedResults);
    setSuggestions(combinedResults);
    if (combinedResults.length === 0) {
        console.log('[MapSearchBar] Setting error: No results found.');
        setError("No results found.");
    } else {
        setError(null);
    }
    setIsLoading(false);
  }, [allItems, userLocation]);

  // Debounce the client-side search function - reduce timeout for faster response
  const debouncedClientSearch = useRef(debounce(performClientSearch, 150)).current;

  useEffect(() => {
    // Cleanup debounce on unmount
    return () => {
      debouncedClientSearch.cancel();
    };
  }, [debouncedClientSearch]);

  const handleInputChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    console.log(`[MapSearchBar] Handling input change for: "${query}"`);
    
    // Reset highlighted index whenever input changes
    setHighlightedIndex(-1);
    
    // Always set the anchor when typing, regardless of query length
    setAnchorEl(searchContainerRef.current);
    
    // Only perform search if query is long enough
    if (query.length >= 2) {
        console.log(`[MapSearchBar] Initiating search for: "${query}"`);
        if (allItems && allItems.length > 0) {
            console.log(`[MapSearchBar] allItems available, count: ${allItems.length}`);
            // Perform search immediately without debounce for instant feedback
            performClientSearch(query);
        } else {
            console.log(`[MapSearchBar] Warning: No items available for search`);
        }
    } else {
        setSuggestions([]);
        setIsLoading(false);
        setError(null);
        // Don't close the popper, just show a "type to search" message
    }
  };

  const handleSelectSuggestion = (item) => {
    console.log("Selected:", item);
    setSearchQuery(item.name); // Keep the selected name in the input
    setSuggestions([]);
    setError(null);
    setIsLoading(false);
    // Don't hide the popper immediately, let it stay open
    if (onSearchResultSelect) {
      onSearchResultSelect(item);
    }
  };

  const handleFocus = (event) => {
    console.log('[MapSearchBar] Input Focused');
    setAnchorEl(searchContainerRef.current); // Set anchor on focus
     // Trigger search immediately on focus if query is already valid
     if (searchQuery.length >= 2) {
        // Call performClientSearch directly for immediate feedback on focus
        performClientSearch(searchQuery);
     } else {
         // Clear any previous suggestions/errors if focusing on an empty/short query
         setSuggestions([]);
         setError(null);
         setIsLoading(false);
     }
  };

  // Remove the blur handler entirely - we don't want the popper to close on blur
  
  // Prevent blur when clicking on the Popper itself or its contents
  const handlePopperMouseDown = (event) => {
      event.preventDefault();
  };

  // Determine if the Popper should be open
  // Always show the popper when typing or when we have search input
  const open = Boolean(anchorEl) || searchQuery.length > 0;

  // Handle keyboard navigation in the dropdown
  const handleKeyDown = (event) => {
    if (!open || suggestions.length === 0) return;

    // Arrow Down
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex(prevIndex => {
        const newIndex = prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0;
        return newIndex;
      });
    }
    // Arrow Up
    else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex(prevIndex => {
        const newIndex = prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1;
        return newIndex;
      });
    }
    // Enter
    else if (event.key === 'Enter' && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
      event.preventDefault();
      handleSelectSuggestion(suggestions[highlightedIndex]);
    }
    // Escape
    else if (event.key === 'Escape') {
      event.preventDefault();
      setAnchorEl(null);
    }
  };

  // Scroll to highlighted item
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const listItems = listRef.current.querySelectorAll('.MuiListItemButton-root');
      if (listItems && listItems[highlightedIndex]) {
        listItems[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // TODO: Implement functions to fetch favorites and claimed deals

  return (
    <Box 
      ref={searchContainerRef} 
      sx={{ 
        position: 'relative', 
        width: '100%',
        // Set a fixed height to prevent layout shift
        minHeight: '56px', // Standard height of TextField with padding
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search places or deals..."
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        autoFocus
        InputProps={{
          endAdornment: isLoading ? <CircularProgress size={20} /> : null,
        }}
        sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 1,
            // Ensure the TextField has a stable size
            height: '56px',
            '& .MuiOutlinedInput-root': {
                height: '56px',
                '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.87)' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' },
              },
        }}
      />
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        style={{ 
          zIndex: 1301, 
          width: searchContainerRef.current?.offsetWidth,
        }}
        onMouseDown={handlePopperMouseDown}
        keepMounted
        modifiers={[
          {
            name: 'preventOverflow',
            enabled: true,
            options: {
              altAxis: true,
              altBoundary: true,
              tether: true,
              rootBoundary: 'document',
              padding: 8,
            },
          },
          {
            name: 'offset',
            enabled: true,
            options: {
              offset: [0, 2], // Small offset to prevent jittering
            },
          }
        ]}
      >
        <Paper elevation={3} sx={{ maxHeight: '200px', overflow: 'auto' }}>
          <List dense ref={listRef}>
            {isLoading ? (
                <ListItem>
                    <ListItemText primary="Loading..." />
                </ListItem>
            ) : error ? (
                <ListItem>
                    <ListItemText primary={error} />
                </ListItem>
            ) : suggestions.length > 0 ? (
              suggestions.map((item, index) => (
                <ListItemButton 
                    key={item.id} 
                    onClick={() => handleSelectSuggestion(item)}
                    onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking
                    onMouseEnter={() => setHighlightedIndex(index)}
                    selected={highlightedIndex === index}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(25, 118, 210, 0.12)', // Light blue highlight
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.2)',
                      }
                    }}
                >
                  <ListItemText
                    primary={item.name}
                    secondary={item.distanceMiles !== null ? `${item.distanceMiles.toFixed(1)} miles` : null}
                  />
                </ListItemButton>
              ))
            ) : searchQuery.length > 0 ? (
              <ListItem>
                  <ListItemText primary={searchQuery.length < 2 ? "Type at least 2 characters..." : "No results found"} /> 
              </ListItem>
            ) : (
              <ListItem>
                  <ListItemText primary="Type to search..." /> 
              </ListItem>
            )}
          </List>
        </Paper>
      </Popper>
    </Box>
  );
};

export default MapSearchBar; 