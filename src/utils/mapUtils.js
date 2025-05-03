/**
 * Map utility functions for creating markers and handling map interactions
 */

/**
 * Creates a custom marker element for the map
 * @param {Object} item - The item data to use for the marker
 * @returns {HTMLElement} - The marker DOM element
 */
export const createMarkerElement = (item) => {
  // Create a marker element
  const el = document.createElement('div');
  el.className = 'custom-marker';
  
  // Add a class based on item type if available
  if (item.type) {
    el.classList.add(`marker-type-${item.type}`);
  }
  
  // Style the marker based on item properties
  el.style.backgroundColor = getMarkerColor(item);
  el.style.width = '25px';
  el.style.height = '25px';
  el.style.borderRadius = '50%';
  el.style.border = '2px solid white';
  el.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.3)';
  el.style.cursor = 'pointer';
  
  // Set data attributes for easier identification
  el.dataset.id = item.id;
  el.dataset.name = item.name || '';
  
  // Create tooltip/title
  el.title = item.name || 'Unnamed location';
  
  return el;
};

/**
 * Determines the appropriate marker color based on item properties
 * @param {Object} item - The item data
 * @returns {string} - CSS color value
 */
export const getMarkerColor = (item) => {
  // Default color
  let color = '#3FB1CE'; // Default Mapbox blue
  
  // Assign colors based on item type if available
  if (item.type) {
    switch (item.type.toLowerCase()) {
      case 'restaurant':
      case 'food':
      case 'dining':
        color = '#FF5252'; // Red
        break;
      case 'shopping':
      case 'retail':
      case 'store':
        color = '#FF9800'; // Orange
        break;
      case 'hotel':
      case 'accommodation':
      case 'lodging':
        color = '#2196F3'; // Blue
        break;
      case 'attraction':
      case 'landmark':
        color = '#4CAF50'; // Green
        break;
      case 'beach':
        color = '#FFEB3B'; // Yellow
        break;
      case 'event':
        color = '#9C27B0'; // Purple
        break;
      default:
        // Keep default color
        break;
    }
  }
  
  return color;
};

/**
 * Calculates the bounding box to fit all markers
 * @param {Array} markers - Array of marker objects with coordinates
 * @returns {Object} - Bounding box object with sw and ne properties
 */
export const calculateBoundingBox = (items) => {
  if (!items || items.length === 0) {
    return null;
  }
  
  let minLng = 180;
  let maxLng = -180;
  let minLat = 90;
  let maxLat = -90;
  
  items.forEach(item => {
    if (item.location?.coordinates) {
      const { lat, lng } = item.location.coordinates;
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
  });
  
  // If we have actual bounds (not the default values)
  if (minLng < 180 && maxLng > -180 && minLat < 90 && maxLat > -90) {
    return {
      sw: [minLng, minLat],
      ne: [maxLng, maxLat]
    };
  }
  
  return null;
};

/**
 * Add padding to a bounding box
 * @param {Object} bbox - Bounding box with sw and ne coordinates
 * @param {number} paddingPercent - Padding percentage (e.g., 10 for 10%)
 * @returns {Object} - Padded bounding box
 */
export const addPaddingToBbox = (bbox, paddingPercent = 10) => {
  if (!bbox) return null;
  
  const [[minLng, minLat], [maxLng, maxLat]] = [bbox.sw, bbox.ne];
  
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  
  const latPadding = (latDiff * paddingPercent) / 100;
  const lngPadding = (lngDiff * paddingPercent) / 100;
  
  return {
    sw: [minLng - lngPadding, minLat - latPadding],
    ne: [maxLng + lngPadding, maxLat + latPadding]
  };
}; 