# Map Performance Optimizations

## Overview
This document outlines the optimizations applied to the MapContainer component to resolve performance issues with marker positioning, map panning, and zooming.

## Issues Addressed

1. **Marker Positioning**
   - Problem: Markers were not staying locked to their GPS coordinates during map panning, causing them to slide around before finally settling back into position.
   - Solution: Implemented proper marker positioning with improved CSS rendering and map event handling.

2. **Accuracy Circle**
   - Problem: A large circle around the user's geolocation was affecting the map's ability to zoom out properly.
   - Solution: Removed the accuracy circle while maintaining the user location marker.

3. **Panning Performance**
   - Problem: Map panning was janky and stuttered, especially after the first fluid motion.
   - Solution: Implemented proper rendering optimizations and reduced state updates during map movement.

4. **Mousewheel Zoom**
   - Problem: Zooming required holding the Ctrl key while using the mousewheel.
   - Solution: Disabled the cooperativeGestures option to allow standard mousewheel zoom behavior.

5. **Limited Zoom Out**
   - Problem: Users could only zoom out to a limited level, restricting the view of the entire island.
   - Solution: Adjusted minZoom level and increased the maxBounds area.

## Technical Implementations

### Marker Optimization
```javascript
// Optimized marker creation logic
const createItemMarkers = () => {
  // Check which markers already exist to avoid recreating them
  const existingMarkerIds = Object.keys(markers.current);
  const newItemIds = items.map(item => item.id);
  
  // Remove markers that no longer exist in items
  existingMarkerIds.forEach(id => {
    if (!newItemIds.includes(id)) {
      markers.current[id].remove();
      delete markers.current[id];
    }
  });
  
  // Only create new markers or update existing ones
  items.forEach(item => {
    // If marker already exists, just update its position
    if (markers.current[item.id]) {
      markers.current[item.id].setLngLat([lng, lat]);
      return;
    }
    
    // Otherwise create a new marker
    // ...
  });
};
```

### Map Configuration
```javascript
map.current = new mapboxgl.Map({
  style: 'mapbox://styles/mapbox/light-v11',  // Lighter style for better performance
  minZoom: 5,  // Allow zooming out further (was 8)
  maxBounds: [
    [-157.5, 19.5],  // Expanded boundaries
    [-155.0, 22.0]   // Expanded boundaries
  ],
  cooperativeGestures: false,  // Enable regular mousewheel zoom
  fadeDuration: 0,  // Disable fading animations for better performance
  maxPitch: 0  // Keep the map flat for better performance
});
```

### CSS Enhancements
```css
/* Force hardware acceleration */
.mapboxgl-map-container {
  transform: translate3d(0, 0, 0);
  -webkit-transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  perspective: 1000;
  will-change: transform;
}

/* Optimize rendering during movement */
.map-moving .mapboxgl-marker {
  transition: none !important;
  image-rendering: optimizeSpeed;
}
```

### State Management
```javascript
// Update viewport state only on moveend with debounce
map.current.on('moveend', () => {
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
  }, 300);
});

// Intelligent viewport changes
useEffect(() => {
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
    // Different strategies for different types of changes
    if (!centerChanged && zoomChanged && Math.abs(currentZoom - parseFloat(viewport.zoom)) < 1) {
      map.current.jumpTo({
        zoom: parseFloat(viewport.zoom)
      });
    } else {
      map.current.flyTo({
        center: [parseFloat(viewport.lng), parseFloat(viewport.lat)],
        zoom: parseFloat(viewport.zoom),
        essential: true,
        speed: 2.0
      });
    }
  }
}, [viewport]);
```

## Results
These optimizations have resulted in:
1. Markers that stay locked to their GPS coordinates during map panning
2. Smooth and fluid map panning without jankiness or stuttering
3. Standard mousewheel zoom behavior without requiring modifier keys
4. Ability to zoom out further to see more of the map
5. Improved overall performance and user experience

## Future Considerations
1. If marker clustering is implemented, additional optimizations may be needed for handling large numbers of markers
2. Consider implementing virtual rendering for markers that are outside the viewport
3. Monitor performance as more features are added to the map, such as polylines for routes or additional interactive elements 