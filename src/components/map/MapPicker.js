import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set access token globally
mapboxgl.accessToken = 'pk.eyJ1IjoicGF0aGZpbmRyIiwiYSI6ImNtNXpnaWtxZDAyZGsya29vZno2eHZmdHkifQ.7y3kEVzLKOxlqAFAbdUktQ';

// Maui bounds
const MAUI_BOUNDS = {
  north: 21.0,
  south: 20.5,
  west: -156.7,
  east: -155.9
};

// Using a simpler style that should load faster
const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11';

function MapPicker({ onLocationSelect, initialLat, initialLng }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [displayLat, setDisplayLat] = useState('');
  const [displayLng, setDisplayLng] = useState('');

  // --- Refs for callbacks ---
  const onLocationSelectRef = useRef(onLocationSelect);
  const handleMarkerDragRef = useRef();
  const updateLocationRef = useRef();

  // Keep the onLocationSelect ref updated with the latest prop value
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // --- Internal Callbacks ---

  // Memoized callback for marker drag end
  const handleMarkerDrag = useCallback(() => {
    if (marker.current) {
      const { lng, lat } = marker.current.getLngLat();
      setDisplayLat(lat);
      setDisplayLng(lng);
      // Use ref to call the latest onLocationSelect function
      if (onLocationSelectRef.current) {
        onLocationSelectRef.current(lat, lng);
      }
    }
  }, []); // No dependencies needed as it uses the ref

  // Keep the handleMarkerDrag ref updated
  useEffect(() => {
    handleMarkerDragRef.current = handleMarkerDrag;
  }, [handleMarkerDrag]);

  // Memoized callback to update location state, marker position, and notify parent
  const updateLocation = useCallback((lat, lng, shouldFlyTo = false) => {
    // Basic validation for Maui bounds
    if (lat === undefined || lng === undefined || 
        lat < MAUI_BOUNDS.south || lat > MAUI_BOUNDS.north ||
        lng < MAUI_BOUNDS.west || lng > MAUI_BOUNDS.east) {
      setError('Coordinates are outside of Maui bounds or invalid.');
      return; // Don't update if invalid
    }

    setDisplayLat(lat);
    setDisplayLng(lng);
    // Use ref to call the latest onLocationSelect function
    if (onLocationSelectRef.current) {
      onLocationSelectRef.current(lat, lng);
    }
    setError(null); // Clear previous errors

    // Update map marker/view only if map is loaded
    if (map.current && mapLoaded) {
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        // Create marker if it doesn't exist
        marker.current = new mapboxgl.Marker({ draggable: true, color: '#4CAF50' })
          .setLngLat([lng, lat])
          .addTo(map.current)
          // Use stable wrapper for listener that calls the LATEST handler via ref
          .on('dragend', () => {
            if (handleMarkerDragRef.current) {
              handleMarkerDragRef.current();
            }
          });
      }
      // Optionally fly to the new location
      if (shouldFlyTo) {
         map.current.flyTo({ center: [lng, lat], zoom: 15, essential: true });
      }
    }
  // Dependencies only include things used directly inside, not refs or functions called via refs
  }, [mapLoaded]); 

  // Keep the updateLocation ref updated
  useEffect(() => {
    updateLocationRef.current = updateLocation;
  }, [updateLocation]);

  // --- Effects ---

  // Effect to update display coordinates when props change
  useEffect(() => {
    // Only update display if different from props to avoid potential loops
    const currentDisplayLat = parseFloat(displayLat);
    const currentDisplayLng = parseFloat(displayLng);
    if (initialLat !== undefined && (isNaN(currentDisplayLat) || Math.abs(currentDisplayLat - initialLat) > 1e-6)) {
        setDisplayLat(initialLat);
    }
    if (initialLng !== undefined && (isNaN(currentDisplayLng) || Math.abs(currentDisplayLng - initialLng) > 1e-6)) {
        setDisplayLng(initialLng);
    }
    // Set to empty string if prop is null/undefined
    if (initialLat == null) setDisplayLat('');
    if (initialLng == null) setDisplayLng('');

  }, [initialLat, initialLng]); // Rerun only when initial props change

  // Effect for ONE-TIME map initialization on mount
  useEffect(() => {
    if (map.current || !mapContainer.current) return; // Initialize only once

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAPBOX_STYLE,
        center: [initialLng ?? -156.3, initialLat ?? 20.75], // Use initial props or default
        zoom: 10,
        maxBounds: [
          [MAUI_BOUNDS.west, MAUI_BOUNDS.south],
          [MAUI_BOUNDS.east, MAUI_BOUNDS.north]
        ]
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        console.log('Map loaded successfully');
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add initial marker *after* map loads, if coords provided
        // Use the ref to ensure the latest updateLocation logic is used
        if (initialLat !== undefined && initialLng !== undefined) {
            if (updateLocationRef.current) {
              updateLocationRef.current(initialLat, initialLng, false);
            }
        }

        // Use stable wrapper for listener that calls the LATEST handler via ref
        map.current.on('click', (e) => {
          const { lng, lat } = e.lngLat;
          if (updateLocationRef.current) {
            updateLocationRef.current(lat, lng);
          }
        });
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setError('Error loading map');
        setMapLoaded(false); // Ensure loaded is false on error
      });

    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Error initializing map');
      setMapLoaded(false);
    }

    // Cleanup function: ONLY runs on component unmount
    return () => {
      console.log('Cleaning up map');
      if (marker.current) {
         // Mapbox remove() should handle listener cleanup, but being explicit doesn't hurt
         // marker.current.off('dragend'); 
         marker.current.remove();
         marker.current = null;
      } 
      if (map.current) {
        // map.current.off('click'); 
        // map.current.off('load');
        // map.current.off('error');
        map.current.remove();
        map.current = null; // Clear ref
      } 
      setMapLoaded(false); // Reset loaded state on unmount
    };
  // Dependencies: Include initial coords used for setup.
  }, [initialLat, initialLng]); // Correctly run only on mount/unmount, using initial props

  // Effect to update marker/view when initialLat/initialLng props change *after* initial load
  useEffect(() => {
    // Ensure map is loaded and props are valid numbers
    if (mapLoaded && typeof initialLat === 'number' && typeof initialLng === 'number') {
       const currentMarkerLngLat = marker.current?.getLngLat();
       // Check if props differ significantly from current marker position
       const latDiff = Math.abs(currentMarkerLngLat?.lat - initialLat);
       const lngDiff = Math.abs(currentMarkerLngLat?.lng - initialLng);
       // Update only if marker doesn't exist or position is different (with tolerance)
       if (!marker.current || latDiff > 1e-6 || lngDiff > 1e-6) {
            console.log('Props changed, updating location from effect');
            // Use ref to ensure the latest updateLocation logic is used
            if (updateLocationRef.current) {
              updateLocationRef.current(initialLat, initialLng, false); // Update marker without flying
            }
       }
    }
  // Rerun when props or mapLoaded status change
  }, [initialLat, initialLng, mapLoaded]); 

  // --- Event Handlers ---

  const handleGeolocation = () => {
    setIsLocating(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Check if location is within Maui bounds
        if (latitude < MAUI_BOUNDS.south || latitude > MAUI_BOUNDS.north ||
            longitude < MAUI_BOUNDS.west || longitude > MAUI_BOUNDS.east) {
          setError('Your location is outside of Maui');
          setIsLocating(false);
          return;
        }

        // Use ref to ensure the latest updateLocation logic is used
        if (map.current && mapLoaded) {
          if (updateLocationRef.current) {
            updateLocationRef.current(latitude, longitude, true);
          }
        }
        setIsLocating(false);
      },
      (error) => {
        setError(`Error getting location: ${error.message}`);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  // Handle manual input changes
  const handleLatChange = (e) => {
    const val = e.target.value;
    setDisplayLat(val); // Update display immediately for responsiveness
    const newLat = parseFloat(val);
    const currentLng = parseFloat(displayLng);
    // Use ref to ensure the latest updateLocation logic is used
    if (!isNaN(newLat) && !isNaN(currentLng)) {
       if (updateLocationRef.current) {
         updateLocationRef.current(newLat, currentLng);
       }
    }
  };

  const handleLngChange = (e) => {
    const val = e.target.value;
    setDisplayLng(val); // Update display immediately
    const newLng = parseFloat(val);
    const currentLat = parseFloat(displayLat);
    // Use ref to ensure the latest updateLocation logic is used
     if (!isNaN(newLng) && !isNaN(currentLat)) {
       if (updateLocationRef.current) {
         updateLocationRef.current(currentLat, newLng);
       }
    }
  };

  // --- Render --- 
  return (
    <div className="map-picker">
      <div ref={mapContainer} className="map-container" />
      
      <div className="map-controls">
          <button 
            className="geolocation-button"
            onClick={handleGeolocation}
            disabled={isLocating || !mapLoaded}
            type="button"
          >
            {isLocating ? 'Getting location...' : '📍 Use my location'}
          </button>
          
          <div className="coordinate-inputs">
             <label>
                Lat:
                <input 
                    type="number" 
                    value={displayLat} 
                    onChange={handleLatChange} 
                    placeholder="Latitude"
                    step="any" // Allow decimals
                    // Add min/max based on MAUI_BOUNDS? Or rely on updateLocation validation
                />
             </label>
             <label>
                Lng:
                <input 
                    type="number" 
                    value={displayLng} 
                    onChange={handleLngChange} 
                    placeholder="Longitude"
                    step="any" // Allow decimals
                    // Add min/max based on MAUI_BOUNDS?
                />
             </label>
          </div>
      </div>

      {!mapLoaded && (
        <div className="map-loading">
          Loading map...
        </div>
      )}

      {error && (
        <div className="map-error">
          {error}
        </div>
      )}

      <div className="map-instructions">
        Click map or use controls to set location. Drag marker to adjust.
      </div>
    </div>
  );
}

MapPicker.propTypes = {
  onLocationSelect: PropTypes.func.isRequired,
  initialLat: PropTypes.number,
  initialLng: PropTypes.number
};

// Add defaultProps to prevent undefined warning on initial render
MapPicker.defaultProps = {
  onLocationSelect: () => {},
  initialLat: undefined,
  initialLng: undefined
};

export default MapPicker; 