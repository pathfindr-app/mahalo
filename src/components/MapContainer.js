import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Initialize Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoicGF0aGZpbmRyIiwiYSI6ImNtNXpnaWtxZDAyZGsya29vZno2eHZmdHkifQ.7y3kEVzLKOxlqAFAbdUktQ';

// Maui center coordinates
const MAUI_CENTER = {
  lng: -156.3319,
  lat: 20.8029,
  zoom: 9
};

const MapContainer = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewport, setViewport] = useState(MAUI_CENTER);
  const [userLocation, setUserLocation] = useState(null);

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
          color: '#2196F3'
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

  // Initialize map
  useEffect(() => {
    let mapInstance = null;

    const initializeMap = async () => {
      if (!mapContainer.current) return;

      try {
        mapInstance = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/pathfindr/cm1dfx68z028i01q18dz5c8c1',
          center: [MAUI_CENTER.lng, MAUI_CENTER.lat],
          zoom: MAUI_CENTER.zoom,
          attributionControl: true,
        });

        map.current = mapInstance;

        await new Promise((resolve) => {
          mapInstance.on('load', resolve);
        });

        // Add controls after map is loaded
        mapInstance.addControl(new mapboxgl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true
        }), 'top-right');

        mapInstance.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

        // Handle map move events
        mapInstance.on('move', () => {
          setViewport({
            lng: mapInstance.getCenter().lng.toFixed(4),
            lat: mapInstance.getCenter().lat.toFixed(4),
            zoom: mapInstance.getZoom().toFixed(2)
          });
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Error initializing map');
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

      if (mapInstance) {
        if (mapInstance.getSource('accuracy-circle')) {
          mapInstance.removeLayer('accuracy-circle');
          mapInstance.removeSource('accuracy-circle');
        }
        mapInstance.remove();
        map.current = null;
      }
    };
  }, []);

  // Watch user's location
  useEffect(() => {
    if (!map.current || !map.current.loaded()) return;

    let watchId;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        updateUserLocation,
        (err) => {
          console.warn('Location error:', err);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [map.current]);

  if (error) {
    return <div className="map-error">Error: {error}</div>;
  }

  return (
    <div className="map-container">
      {isLoading && <div className="map-loading">Loading map...</div>}
      <div ref={mapContainer} style={{ width: '100%', height: '100vh', position: 'relative' }} />
      <div className="map-overlay">
        <p>
          Longitude: {viewport.lng} | Latitude: {viewport.lat} | Zoom: {viewport.zoom}
        </p>
        {userLocation && (
          <p className="user-location">
            Your location: {userLocation.lng.toFixed(4)}, {userLocation.lat.toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
};

export default MapContainer; 