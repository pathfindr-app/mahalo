import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../../styles/MapContainer.css'; // Use relative path for component-specific CSS
import { queryItems } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext'; // Assuming AuthContext provides user info
import ItemDetailModal from './ItemDetailModal'; // Assuming it's in the same directory
import { createMarkerElement } from '../../utils/mapUtils'; // Import the utility function
import MapSearchBar from './MapSearchBar'; // Import the search bar

const MapContainer = () => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const userLocationMarkerRef = useRef(null);
    const accuracyCircleRef = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [items, setItems] = useState([]);
    const [markers, setMarkers] = useState({}); // Use an object to store markers by itemId
    const [selectedItemId, setSelectedItemId] = useState(null); // For opening the modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userCoordinates, setUserCoordinates] = useState(null);

    const { currentUser } = useAuth(); // Get user info if needed for features

    // Convert userCoordinates to the format expected by MapSearchBar
    const userLocationForMap = userCoordinates ? {
        lat: userCoordinates.latitude,
        lng: userCoordinates.longitude
    } : null;

    // Load items from Firestore when component mounts
    useEffect(() => {
        const loadItems = async () => {
            try {
                console.log('Fetching items from Firestore...');
                const fetchedItems = await queryItems();
                console.log('Items fetched successfully, count:', fetchedItems?.length);
                console.log('Sample item:', fetchedItems?.[0]);
                setItems(fetchedItems || []); // Ensure we set an empty array if fetchedItems is null/undefined
            } catch (err) {
                console.error('Error fetching items:', err);
                setError('Failed to load items');
            }
        };

        loadItems();
    }, []);

    // Get user's current location
    useEffect(() => {
        const getUserLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        console.log('User location obtained:', latitude, longitude);
                        setUserCoordinates({
                            latitude,
                            longitude
                        });
                    },
                    (error) => {
                        console.error('Error getting user location:', error);
                    }
                );
            } else {
                console.error('Geolocation is not supported by this browser.');
            }
        };

        getUserLocation();
    }, []);

    const handleSearchResultSelect = useCallback((item) => {
        console.log('Navigating to selected item:', item);
        if (mapRef.current && item.location?.coordinates) {
            const { lat, lng } = item.location.coordinates;
            mapRef.current.flyTo({
                center: [lng, lat],
                zoom: 15, // Zoom closer when selecting an item
                essential: true // this animation is considered essential with respect to prefers-reduced-motion
            });
            // Optionally open the modal directly
            // handleMarkerClick(item.id);
        }
    }, []); // Add dependencies if needed (e.g., handleMarkerClick)

    // Handle closing the item detail modal
    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedItemId(null);
    }, []);

    console.log('MapContainer: Reaching return statement'); // <-- ADDED FOR DEBUGGING

    return (
        <div className="map-container-wrapper">
            <h1>Test Search Bar Location</h1>
            {/* Wrap search bar in div with fixed height to prevent layout shifts */}
            <div style={{ 
                height: '60px',  /* Fixed height container for the search bar */
                width: '100%',
                marginBottom: '10px'
            }}>
                <MapSearchBar 
                    onSearchResultSelect={handleSearchResultSelect} 
                    userLocation={userLocationForMap}
                    allItems={items}
                />
            </div>
            <div ref={mapContainerRef} className="map-container" />
            {error && <div className="map-error-overlay">Error: {error}</div>}
            {!mapLoaded && <div className="map-loading-overlay">Loading Map...</div>}
            {/* Coordinate display can be removed or kept as needed */}
            {/* {userCoordinates && (
                <div className="coordinate-display">
                    Lat: {userCoordinates.latitude.toFixed(4)}, Lng: {userCoordinates.longitude.toFixed(4)}
                </div>
            )} */}
            {selectedItemId && (
                <ItemDetailModal
                    itemId={selectedItemId}
                    open={isModalOpen}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default MapContainer; 