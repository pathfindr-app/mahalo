import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { queryItems } from '../services/firestoreService.js';
import ItemDetailModal from './modals/ItemDetailModal.js';
import '../styles/MapContainer.css'; // Ensure the CSS is imported

// Initialize Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoicGF0aGZpbmRyIiwiYSI6ImNtNXpnaWtxZDAyZGsya29vZno2eHZmdHkifQ.7y3kEVzLKOxlqAFAbdUktQ';

// Maui center coordinates
const MAUI_CENTER = {
  lng: -156.3319,
  lat: 20.8029,
  zoom: 9
};

// POI Types with icons/colors
const TYPE_STYLES = {
  'vendor': { color: '#4CAF50', icon: '🛒' },
  'poi': { color: '#2196F3', icon: '🏠' },
  'beach': { color: '#FFC107', icon: '🏖️' },
  'restaurant': { color: '#FF5722', icon: '🍴' },
  'activity': { color: '#9C27B0', icon: '🎯' }
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

  // Function to create item markers on the map
  const createItemMarkers = () => {
    if (!map.current || !map.current.loaded() || !items.length) {
      console.log('Not creating markers - map loaded:', !!map.current?.loaded(), 'items:', items.length);
      return;
    }

    console.log('Creating markers for', items.length, 'items');
    
    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};
    
    let successCount = 0;
    let failCount = 0;
    
    // Create new markers for each item
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
        el.style.color = 'white';
        el.style.fontSize = '18px';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
        el.style.cursor = 'pointer';
        
        // Set background color based on type or default
        const bgColor = TYPE_STYLES[item.type]?.color || '#757575';
        el.style.backgroundColor = bgColor;
        
        // Create a span for the icon to ensure proper centering
        const iconSpan = document.createElement('span');
        iconSpan.style.display = 'flex';
        iconSpan.style.alignItems = 'center';
        iconSpan.style.justifyContent = 'center';
        
        // Use the normalized icon from item data
        if (item.presentation && item.presentation.icon) {
          console.log(`Using icon from item: "${item.presentation.icon}" for ${item.name}`);
          iconSpan.textContent = item.presentation.icon;
        } else {
          // Fallback to our emoji icons
          const fallbackIcon = TYPE_STYLES[item.type]?.icon || '📍';
          console.log(`Using fallback icon: "${fallbackIcon}" for ${item.name}`);
          iconSpan.textContent = fallbackIcon;
        }
        
        // Append icon span to marker element
        el.appendChild(iconSpan);
        
        // Create popup content
        const popupHTML = `
          <div class="item-tooltip">
            <strong>${item.name}</strong>
            ${item.description?.brief ? `<p>${item.description.brief}</p>` : ''}
          </div>
        `;
        
        // Create and add the marker
        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center'  // Ensures marker stays centered at coordinates
        })
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupHTML))
          .addTo(map.current);
        
        // Log the marker position for debugging
        console.log(`Added marker at coordinates: [${lng}, ${lat}]`);
        
        // Add click event to marker element
        el.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent triggering map click
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
    
    console.log(`Marker creation complete: ${successCount} successful, ${failCount} failed`);
  };

  // Function to update user location marker
  const updateUserLocation = (position) => {
    if (!map.current || !map.current.loaded()) return;

    const { longitude, latitude, accuracy } = position.coords;
    setUserLocation({ lng: longitude, lat: latitude, accuracy });

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

      // Create or update accuracy circle
      if (map.current.loaded() && map.current.getStyle()) {
        const accuracyRadius = {
          'type': 'Feature',
          'properties': {},
          'geometry': {
            'type': 'Point',
            'coordinates': [longitude, latitude]
          }
        };

        if (map.current.getSource('accuracy-circle')) {
          map.current.getSource('accuracy-circle').setData(accuracyRadius);
        } else {
          map.current.addSource('accuracy-circle', {
            'type': 'geojson',
            'data': accuracyRadius
          });

          map.current.addLayer({
            'id': 'accuracy-circle',
            'type': 'circle',
            'source': 'accuracy-circle',
            'paint': {
              'circle-radius': accuracy / 2,
              'circle-color': '#2196F3',
              'circle-opacity': 0.2,
              'circle-stroke-width': 1,
              'circle-stroke-color': '#2196F3'
            }
          });
        }
      }
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
            // Ensure location and coordinates exist with numeric values
            location: {
              coordinates: {
                lat: lat,
                lng: lng
              }
            },
            // Set presentation with icon
            presentation: {
              icon: item.presentation?.icon || TYPE_STYLES[item.type]?.icon || '📍'
            },
            // Set other data
            type: item.type || 'poi',
            description: item.description || {}
          };
          
          console.log(`Normalized item ${normalizedItem.name}: coordinates [${normalizedItem.location.coordinates.lng}, ${normalizedItem.location.coordinates.lat}]`);
          
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
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: [viewport.lng, viewport.lat],
          zoom: viewport.zoom,
          minZoom: 8, // Restrict zooming out too far
          maxBounds: [
            [-156.8, 20.5], // Southwest coordinates (restricting to Maui area)
            [-155.9, 21.0]  // Northeast coordinates
          ]
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
  }, [viewport, items]);

  // Create markers when map is loaded and items are available
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

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (error) {
    return <div className="map-error">Error: {error}</div>;
  }

  return (
    <div className="map-container">
      {isLoading && <div className="map-loading">Loading map...</div>}
      <div ref={mapContainer} style={{ width: '100%', height: '100vh', position: 'relative' }} />
      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        left: '20px', 
        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
        padding: '10px', 
        borderRadius: '4px', 
        zIndex: 10,
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
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        itemId={selectedItem}
      />
    </div>
  );
};

export default MapContainer; 