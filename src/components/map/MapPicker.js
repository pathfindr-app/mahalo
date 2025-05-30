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

  // Effect to update display coordinates when props change
  useEffect(() => {
    // Only update display if different from props to avoid loops if parent updates state based on onLocationSelect
    if (initialLat !== displayLat) setDisplayLat(initialLat || '');
    if (initialLng !== displayLng) setDisplayLng(initialLng || '');
  }, [initialLat, initialLng]);

  // Memoized callback for marker drag end
  const handleMarkerDrag = useCallback(() => {
    if (marker.current) {
      const { lng, lat } = marker.current.getLngLat();
      setDisplayLat(lat);
      setDisplayLng(lng);
      onLocationSelect(lat, lng); // Notify parent
    }
  }, [onLocationSelect]);

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
    onLocationSelect(lat, lng); // Notify parent component
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
          .on('dragend', handleMarkerDrag); // Attach drag handler
      }
      // Optionally fly to the new location
      if (shouldFlyTo) {
         map.current.flyTo({ center: [lng, lat], zoom: 15, essential: true });
      }
    }
  }, [onLocationSelect, mapLoaded, handleMarkerDrag]);

  // Effect for ONE-TIME map initialization on mount
  useEffect(() => {
    if (map.current || !mapContainer.current) return; // Initialize only once

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAPBOX_STYLE,
        center: [initialLng || -156.3, initialLat || 20.75], // Use initial props for first center
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
        if (initialLat !== undefined && initialLng !== undefined) {
            updateLocation(initialLat, initialLng, false); // Use updateLocation to create marker
        }

        // Handle map clicks to place/move marker
        map.current.on('click', (e) => {
          const { lng, lat } = e.lngLat;
          // No need to remove marker here, updateLocation handles create/move
          updateLocation(lat, lng);
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
         // No need to call off explicitly if the map is removed?
         // marker.current.off('dragend', handleMarkerDrag); 
         marker.current.remove();
      } 
      if (map.current) {
        map.current.remove();
        map.current = null; // Clear ref
      } 
      // No need to setMapLoaded(false) here, component is unmounting
    };
  }, []); // <-- EMPTY dependency array ensures this runs only ONCE

  // Effect to update marker/view when initialLat/initialLng props change *after* initial load
  useEffect(() => {
    if (mapLoaded && initialLat !== undefined && initialLng !== undefined) {
       // Check if props differ significantly from current state to avoid minor loops
       const latDiff = Math.abs(displayLat - initialLat);
       const lngDiff = Math.abs(displayLng - initialLng);
       if (latDiff > 0.00001 || lngDiff > 0.00001) {
            console.log('Props changed, updating location from effect');
            updateLocation(initialLat, initialLng, false); // Update marker without flying
       }
    }
  }, [initialLat, initialLng, mapLoaded, updateLocation, displayLat, displayLng]);

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

        // Update map and marker
        if (map.current && mapLoaded) {
          // Let updateLocation handle marker creation/move and flying
          updateLocation(latitude, longitude, true); 
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
    if (!isNaN(newLat) && !isNaN(currentLng)) {
       updateLocation(newLat, currentLng); // Use memoized version
    }
  };

  const handleLngChange = (e) => {
    const val = e.target.value;
    setDisplayLng(val); // Update display immediately
    const newLng = parseFloat(val);
    const currentLat = parseFloat(displayLat);
     if (!isNaN(newLng) && !isNaN(currentLat)) {
       updateLocation(currentLat, newLng); // Use memoized version
    }
  };

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

export default MapPicker; 