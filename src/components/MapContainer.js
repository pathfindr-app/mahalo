import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { queryItems } from '../services/firestoreService.js';
import ItemDetailModal from './modals/ItemDetailModal.js';
import '../styles/MapContainer.css'; // Ensure the CSS is imported
import { useAuth } from '../context/AuthContext'; // Import useAuth
import MapSearchBar from './map/MapSearchBar'; // <-- Import MapSearchBar

// Import the specific icon sets used in the form/data
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
// Add other sets if needed

// Combine the icons for lookup
const ICON_COMPONENTS = {
  ...FaIcons,
  ...MdIcons,
  // ... add other sets here
};

// Helper function to get the icon component by name (similar to ItemForm)
const getIconComponent = (iconName, size = 18) => { // Added default size
  if (!iconName || typeof iconName !== 'string') return null;
  const IconComponent = ICON_COMPONENTS[iconName]; 
  if (!IconComponent) {
      console.warn(`Map Icon component not found for name: ${iconName}. Make sure the corresponding icon set is imported in MapContainer.js`);
      return null;
  }
  // Return the component type itself, not the rendered element yet
  return IconComponent; 
};

// Initialize Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoicGF0aGZpbmRyIiwiYSI6ImNtNXpnaWtxZDAyZGsya29vZno2eHZmdHkifQ.7y3kEVzLKOxlqAFAbdUktQ';

// Maui center coordinates
const MAUI_CENTER = {
  lng: -156.3319,
  lat: 20.8029,
  zoom: 9
};

// POI Types with colors (keep fallback emojis just in case)
const TYPE_STYLES = {
  'vendor': { color: '#4CAF50', fallbackIcon: '🛒' }, 
  'poi': { color: '#2196F3', fallbackIcon: '🏠' }, 
  'beach': { color: '#FFC107', fallbackIcon: '🏖️' }, 
  'restaurant': { color: '#FF5722', fallbackIcon: '🍴' }, 
  'activity': { color: '#9C27B0', fallbackIcon: '🎯' } 
};

const MapContainer = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewport, setViewport] = useState(MAUI_CENTER);
  const [userLocation, setUserLocation] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const markers = useRef({});
  const moveEndTimeout = useRef(null); // Add a ref for the timeout

  // Get user authentication status
  const { currentUser } = useAuth();
  // Determine admin status (adjust property name if needed, e.g., currentUser.claims.admin)
  const isAdmin = currentUser?.isAdmin || false;

  // --- ADDED: Callback for search result selection ---
  const handleSearchResultSelect = useCallback((item) => {
    console.log('Navigating to selected item:', item);
    if (map.current && item.location?.coordinates) {
        const { lat, lng } = item.location.coordinates;
        map.current.flyTo({
            center: [lng, lat],
            zoom: 15, // Zoom closer when selecting an item
            essential: true
        });
        // Optionally open the modal directly
        // handleMarkerClick(item.id); // Requires handleMarkerClick to be defined
    }
  }, []); // Dependencies: map.current (technically stable)
  // --- END ADDED ---

  // Function to create item markers on the map
  const createItemMarkers = () => {
    if (!map.current || !map.current.loaded() || !items.length) {
      console.log('Not creating markers - map loaded:', !!map.current?.loaded(), 'items:', items.length);
      return;
    }

    console.log('Creating markers for', items.length, 'items');
    
    // Check which markers already exist to avoid recreating them
    const existingMarkerIds = Object.keys(markers.current);
    const newItemIds = items.map(item => item.id);
    
    // Remove markers that no longer exist in items
    existingMarkerIds.forEach(id => {
      if (!newItemIds.includes(id)) {
        console.log(`Removing marker for deleted item: ${id}`);
        markers.current[id].remove();
        delete markers.current[id];
      }
    });
    
    let successCount = 0;
    let failCount = 0;
    
    // Disable map move events temporarily while adding markers
    // This prevents jank during marker creation
    const moveHandler = map.current._handlers && map.current._handlers.move;
    if (moveHandler) moveHandler.disable();
    
    // Create new markers (or update existing ones) for each item
    items.forEach(item => {
      try {
        if (!item.location?.coordinates?.lat || !item.location?.coordinates?.lng) {
          console.log('Item missing coordinates:', item.id, item.name);
          failCount++;
          return;
        }

        // Make sure coordinates are numbers
        const lat = parseFloat(item.location.coordinates.lat);
        const lng = parseFloat(item.location.coordinates.lng);
        
        if (isNaN(lat) || isNaN(lng)) {
          console.log('Item has invalid coordinates:', item.id, item.name);
          failCount++;
          return;
        }
        
        // If marker already exists, just update its position
        if (markers.current[item.id]) {
          markers.current[item.id].setLngLat([lng, lat]);
          successCount++;
          return;
        }
        
        console.log(`Creating marker for ${item.name} at [${lng}, ${lat}]`);
        
        // Create marker element
        const el = document.createElement('div');
        el.className = 'item-marker';
        
        // Set fixed dimensions and styling
        el.style.width = '36px';
        el.style.height = '36px';
        el.style.borderRadius = '50%';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.style.backgroundRepeat = 'no-repeat';
        el.innerHTML = '';
        
        // Set background color based on type or default (will be overridden by logo if present)
        const bgColor = TYPE_STYLES[item.type]?.color || '#757575';
        el.style.backgroundColor = bgColor;
        
        // --- Icon/Logo Logic --- 
        if (item.presentation?.logoUrl) {
          // 1. Use Logo URL as background image (highest priority)
          console.log(`Using logoUrl: ${item.presentation.logoUrl} for ${item.name}`);
          el.style.backgroundImage = `url(${item.presentation.logoUrl})`;
          el.style.backgroundColor = 'transparent'; // Ensure background color doesn't interfere
          // No text/icon needed inside

        } else {
          // 2. Try React Icon (second priority)
          const IconComponent = getIconComponent(item.presentation?.icon);
          el.style.color = 'white'; // Set text color for icon/emoji
          if (IconComponent) {
            console.log(`Rendering React Icon: ${item.presentation.icon} for ${item.name}`);
            // Render React Icon inside the element
            const iconContainer = document.createElement('div'); // Container helps with potential React re-renders
            ReactDOM.render(React.createElement(IconComponent, { size: 18, color: 'white' }), iconContainer);
            el.appendChild(iconContainer);
          } else {
            // 3. Fallback to text/emoji (lowest priority)
            const fallbackIcon = TYPE_STYLES[item.type]?.fallbackIcon || '📍';
            console.log(`Using fallback icon: "${fallbackIcon}" for ${item.name}`);
            el.textContent = fallbackIcon;
          }
        }
        // --- End Icon/Logo Logic --- 
        
        // Create popup content
        const popupHTML = `
          <div class="item-tooltip">
            <strong>${item.name}</strong>
            ${item.description?.brief ? `<p>${item.description.brief}</p>` : ''}
          </div>
        `;
        
        // Create and add the marker
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupHTML);
        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center'  // Ensures marker stays centered at coordinates
        })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current);
        
        // Log the marker position for debugging
        console.log(`Added marker at coordinates: [${lng}, ${lat}]`);
        
        // Add click event to marker element
        el.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent triggering map click
          console.log(`Marker clicked: ${item.name} (ID: ${item.id})`); // Log click
          setSelectedItem(item.id);
          setIsModalOpen(true);
        });
        
        // Store marker reference
        markers.current[item.id] = marker;
        successCount++;
      } catch (err) {
        console.error('Error creating marker for item:', item.name, err);
        failCount++;
      }
    });
    
    // Re-enable map move events
    if (moveHandler) moveHandler.enable();
    
    console.log(`Marker creation complete: ${successCount} successful, ${failCount} failed`);
  };

  // Function to update user location marker
  const updateUserLocation = (position) => {
    if (!map.current || !map.current.loaded()) return;

    const { longitude, latitude, accuracy } = position.coords;
    setUserLocation({ lng: longitude, lat: latitude, accuracy }); // Keep accuracy for UI display

    try {
      // Create or update marker
      if (!userMarker.current) {
        const el = document.createElement('div');
        el.className = 'user-location-marker';
        userMarker.current = new mapboxgl.Marker({
          element: el,
          anchor: 'center'
        });
      }

      userMarker.current.setLngLat([longitude, latitude]).addTo(map.current);

      // We've removed the accuracy circle that was distracting during zoom out

    } catch (err) {
      console.error('Error updating user location:', err);
    }
  };

  // Fetch items from Firebase
  useEffect(() => {
    const fetchItems = async () => {
      try {
        console.log('Fetching items from Firestore...');
        const itemsData = await queryItems({ activeOnly: true });
        console.log('Fetched items:', itemsData.length);
        
        // Log the raw item data to see what we're working with
        itemsData.forEach((item, index) => {
          console.log(`Raw Firestore item #${index + 1}:`, {
            id: item.id,
            name: item.name,
            type: item.type,
            coordinates: item.location?.coordinates,
            icon: item.presentation?.icon,
          });
        });
        
        // Normalize item data structure before setting state
        const normalizedItems = itemsData.map(item => {
          // Extract coordinates and ensure they're numeric values
          let lat = typeof item.location?.coordinates?.lat === 'number' 
            ? item.location.coordinates.lat 
            : parseFloat(item.location?.coordinates?.lat);
          
          let lng = typeof item.location?.coordinates?.lng === 'number'
            ? item.location.coordinates.lng
            : parseFloat(item.location?.coordinates?.lng);
          
          // Check if coordinates are valid numbers
          if (isNaN(lat) || isNaN(lng)) {
            console.warn(`Invalid coordinates for item ${item.name}, using default Maui center`);
            lat = 20.7984;  // Default to center of Maui
            lng = -156.3319;
          }
          
          // Create a normalized structure for each item
          const normalizedItem = {
            id: item.id,
            name: item.name || 'Unnamed Item',
            location: {
              coordinates: {
                lat: lat,
                lng: lng
              }
            },
            // Set presentation with icon and logoUrl
            presentation: {
              icon: item.presentation?.icon || null, // Keep icon or null
              logoUrl: item.presentation?.logoUrl || null // <<< Add logoUrl
            },
            type: item.type || 'poi',
            description: item.description || { brief: '' } // Ensure description object exists
          };
          
          console.log(`Normalized item ${normalizedItem.name}: coordinates [${normalizedItem.location.coordinates.lng}, ${normalizedItem.location.coordinates.lat}], logo: ${normalizedItem.presentation.logoUrl}, icon: ${normalizedItem.presentation.icon}`);
          
          return normalizedItem;
        });
        
        setItems(normalizedItems);
        setIsLoading(false);
        
        // Trigger marker creation after a delay to ensure map is loaded
        setTimeout(() => {
          createItemMarkers();
        }, 500);
      } catch (error) {
        console.error('Error fetching items:', error);
        setError('Failed to load items');
        setIsLoading(false);
      }
    };

    // Only attempt to fetch items when the map is ready
    if (map.current?.loaded()) {
      fetchItems();
    } else {
      // Set up an event listener for when the map loads
      const checkMapLoaded = () => {
        if (map.current?.loaded()) {
          fetchItems();
        } else {
          setTimeout(checkMapLoaded, 500);
        }
      };
      checkMapLoaded();
    }
  }, [map.current]); // Re-run when map reference changes

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      try {
        if (map.current) return; // Skip if map already initialized
        
        console.log('Initializing map...');
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11', // Use a lighter style for better performance
          center: [viewport.lng, viewport.lat],
          zoom: viewport.zoom,
          minZoom: 5, // Allow zooming out further (was 8)
          maxBounds: [
            [-157.5, 19.5], // Southwest coordinates (expanded beyond Maui)
            [-155.0, 22.0]  // Northeast coordinates (expanded beyond Maui)
          ],
          renderWorldCopies: false, // Prevents duplicate markers when panning
          attributionControl: false, // We'll add this separately
          antialias: true, // Smoother rendering
          cooperativeGestures: false, // DISABLED - allow regular mousewheel zoom without Ctrl
          dragRotate: false, // Disable rotation to simplify navigation
          localIdeographFontFamily: "'Noto Sans', 'Noto Sans CJK SC', sans-serif", // Faster font loading
          fadeDuration: 0, // Disable fading animations for better performance
          trackResize: true,
          maxPitch: 0 // Keep the map flat for better performance
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
        map.current.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true
            },
            trackUserLocation: true
          }),
          'top-right'
        );
        
        // Add attribution in the bottom right (since we disabled the default)
        map.current.addControl(new mapboxgl.AttributionControl(), 'bottom-right');

        // Watch user's location
        if (navigator.geolocation) {
          navigator.geolocation.watchPosition(
            updateUserLocation,
            (error) => {
              console.warn('Error getting user location:', error.message);
              setError('Unable to access your location. Some features may be limited.');
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        }

        // Set up event handlers
        map.current.on('load', () => {
          console.log('Map loaded');
          setIsLoading(false);
          
          // Create markers once the map is loaded (if we have items)
          if (items.length > 0) {
            createItemMarkers();
          }
        });
        
        // Reduce rendering during active panning to improve performance
        map.current.on('movestart', () => {
          // Set a CSS class on the container to optimize rendering during movement
          mapContainer.current.classList.add('map-moving');
        });
        
        // Add event listeners for viewport updates with more aggressive debouncing
        map.current.on('moveend', () => {
          // Remove the moving class to restore normal rendering
          mapContainer.current.classList.remove('map-moving');
          
          // Only update viewport state when the map stops moving
          // This prevents constant re-renders during panning
          if (moveEndTimeout.current) {
            clearTimeout(moveEndTimeout.current);
          }
          
          moveEndTimeout.current = setTimeout(() => {
            if (map.current) {
              setViewport({
                lng: map.current.getCenter().lng.toFixed(4),
                lat: map.current.getCenter().lat.toFixed(4),
                zoom: map.current.getZoom().toFixed(2)
              });
            }
          }, 300); // Increased timeout for better performance
        });
        
        map.current.on('error', (e) => {
          console.error('Mapbox error:', e);
          setError('An error occurred with the map. Please try refreshing the page.');
        });
        
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize map');
        setIsLoading(false);
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      // Clear the timeout if it exists
      if (moveEndTimeout.current) {
        clearTimeout(moveEndTimeout.current);
      }
      
      if (userMarker.current) {
        userMarker.current.remove();
        userMarker.current = null;
      }

      // Clear item markers
      Object.values(markers.current).forEach(marker => marker.remove());
      markers.current = {};

      if (map.current) {
        if (map.current.getSource('accuracy-circle')) {
          map.current.removeLayer('accuracy-circle');
          map.current.removeSource('accuracy-circle');
        }
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Remove viewport and items from dependency array to prevent map reinitialization

  // Create markers when items change
  useEffect(() => {
    if (map.current && map.current.loaded() && items.length > 0) {
      // Extra check to make sure the style is loaded
      if (!map.current.getStyle()) {
        console.log('Map style not loaded yet, waiting...');
        const checkStyleLoaded = () => {
          if (map.current?.getStyle()) {
            console.log('Map style now loaded, creating markers');
            createItemMarkers();
          } else {
            setTimeout(checkStyleLoaded, 100);
          }
        };
        checkStyleLoaded();
      } else {
        console.log('Items changed, creating markers');
        createItemMarkers();
      }
    }
  }, [items]);

  // Update the map view when viewport changes (but don't reinitialize map)
  useEffect(() => {
    // Skip expensive animations if the map isn't initialized
    if (!map.current || !map.current.loaded()) return;
    
    // Get current values from the map
    const currentCenter = map.current.getCenter();
    const currentZoom = map.current.getZoom();
    
    // Calculate if the change is significant enough to animate
    const centerChanged = 
      Math.abs(currentCenter.lng - parseFloat(viewport.lng)) > 0.001 || 
      Math.abs(currentCenter.lat - parseFloat(viewport.lat)) > 0.001;
    
    const zoomChanged = Math.abs(currentZoom - parseFloat(viewport.zoom)) > 0.1;
    
    // Only animate if there's a significant change
    if (centerChanged || zoomChanged) {
      // For small zoom changes, use jumpTo instead of flyTo for better performance
      if (!centerChanged && zoomChanged && Math.abs(currentZoom - parseFloat(viewport.zoom)) < 1) {
        map.current.jumpTo({
          zoom: parseFloat(viewport.zoom)
        });
      } else {
        // Use flyTo for significant changes
        map.current.flyTo({
          center: [parseFloat(viewport.lng), parseFloat(viewport.lat)],
          zoom: parseFloat(viewport.zoom),
          essential: true,
          speed: 2.0, // Faster animation
          curve: 1,
          easing: t => t
        });
      }
    }
  }, [viewport]);

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    console.log('Modal closed');
  };

  if (error) {
    return <div className="map-error">Error: {error}</div>;
  }

  return (
    // Use a wrapper div to establish positioning context
    <div className="map-container-wrapper"> 
      {isLoading && <div className="map-loading">Loading map...</div>}
      
      {/* --- ADDED: Render Search Bar --- */}
      <MapSearchBar onSearchResultSelect={handleSearchResultSelect} />
      {/* --- END ADDED --- */}
      
      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '100%', // Occupy full height of wrapper
          // Removed position:relative and overflow:hidden from inline style
        }} 
        className="mapboxgl-map-container" // Retain class if needed by Mapbox
      />
      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        left: '20px', 
        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
        padding: '10px', 
        borderRadius: '4px', 
        zIndex: 10, // Lower z-index than search bar
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        fontSize: '12px'
      }}>
        <p>
          Longitude: {viewport.lng} | Latitude: {viewport.lat} | Zoom: {viewport.zoom}
        </p>
        {userLocation && (
          <p style={{ marginTop: '8px', color: '#2196F3', fontWeight: 500 }}>
            Your location: {userLocation.lng.toFixed(4)}, {userLocation.lat.toFixed(4)}
          </p>
        )}
      </div>
      
      {/* Item Detail Modal */}
      <ItemDetailModal 
        open={isModalOpen} // Assuming ItemDetailModal uses 'open' prop
        onClose={handleCloseModal}
        itemId={selectedItem}
        // isAdmin={isAdmin} // Pass isAdmin if needed by modal
      />
    </div>
  );
};

export default MapContainer; 