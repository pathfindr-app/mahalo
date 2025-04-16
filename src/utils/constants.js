// API Keys
export const MAPBOX_TOKEN = "pk.eyJ1IjoicGF0aGZpbmRyIiwiYSI6ImNtNXpnaWtxZDAyZGsya29vZno2eHZmdHkifQ.7y3kEVzLKOxlqAFAbdUktQ";
export const MAPBOX_STYLE = "mapbox://styles/pathfindr/cm1dfx68z028i01q18dz5c8c1";
export const OPEN_WEATHER_API_KEY = "d2911ca189faa26226488b2c36cb10ca";

// Map Configuration
export const DEFAULT_MAP_CENTER = [20.7984, -156.3319]; // Maui coordinates
export const DEFAULT_ZOOM_LEVEL = 10;
export const MIN_ZOOM_LEVEL = 8;
export const MAX_ZOOM_LEVEL = 18;

// POI Types
export const POI_TYPES = {
  VENDOR: 'vendor',
  POI: 'poi',
  EVENT: 'event',
  BEACH: 'beach',
  RESTAURANT: 'restaurant',
  ACTIVITY: 'activity',
  ACCOMMODATION: 'accommodation',
  SHOPPING: 'shopping'
};

// Modal Layouts
export const MODAL_LAYOUTS = {
  DEFAULT: 'default',
  VENDOR: 'vendor',
  EVENT: 'event',
  POI: 'poi'
};

// Authentication Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

// Errors
export const ERROR_MESSAGES = {
  AUTH_FAILED: 'Authentication failed. Please try again.',
  LOCATION_DENIED: 'Location access denied. Some features may be limited.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  DATA_LOAD_ERROR: 'Failed to load data. Please try again.'
};

export const ALL_TAGS = [
  // Water Activities
  'surfing', 'surf-lessons', 'windsurfing', 'kitesurfing', 'kite-surf', 'foiling',
  'snorkeling', 'scuba-diving', 'dive-shop', 'kayaking', 'canoeing', 'boat-tour',
  'whale-watching', 'sunset-cruise', 'fishing-charter', 'sailing', 'swimming',
  'beach-lounging', 'tide-pooling', 'skim-boarding', 'boogie-boarding', 'lifeguard-on-duty',

  // Land Activities
  'hiking', 'guided-hike', 'trail-running', 'camping', 'backpacking', 'biking',
  'mountain-biking', 'road-cycling', 'horseback-riding', 'ziplining', 'adventure-park',
  'rappelling', 'golfing', 'disc-golf', 'stargazing', 'sunrise-viewing', 'sunset-viewing',
  'farm-tour', 'plantation-visit', 'botanical-garden', 'distillery-tour', 'winery-tour',
  'volcano-viewing', 'haleakala', 'lava-tube', 'bocce-ball', 'volleyball',

  // Culture & History
  'cultural-center', 'museum', 'historical-site', 'landmark', 'luau', 'hula-show',
  'polynesian-culture', 'live-music', 'local-music', 'concert', 'art-gallery',
  'craft-fair', 'local-art', 'art-class', 'historic-town', 'walking-tour',
  'petroglyphs', 'ancient-site', 'oddity',

  // Food & Drink
  'restaurant', 'cafe', 'coffee-shop', 'bakery', 'bar', 'brewery', 'winery',
  'cocktail-lounge', 'food-truck', 'roadside-stand', 'farmers-market', 'local-cuisine',
  'hawaiian-food', 'seafood', 'fresh-fish', 'farm-to-table', 'poke', 'loco-moco',
  'fish-tacos', 'ramen', 'thai-food', 'pizza', 'tacos', 'fine-dining', 'casual-dining',
  'family-friendly', 'romantic', 'vegetarian', 'vegan', 'gluten-free', 'shave-ice',
  'acai-bowl', 'smoothie', 'juice-bar', 'happy-hour', 'ocean-view-dining',

  // Shopping
  'souvenirs', 'gifts', 'clothing-boutique', 'surf-shop', 'resort-wear', 'local-crafts',
  'handmade-goods', 'grocery', 'convenience-store', 'pharmacy', 'shopping-center',

  // Rentals
  'car-rental', 'bike-rental', 'scooter-rental', 'moped-rental', 'kayak-rental',
  'canoe-rental', 'sup-rental', 'surfboard-rental', 'boogie-board-rental',
  'skim-board-rental', 'snorkel-rental', 'dive-gear-rental', 'beach-chair-rental',
  'umbrella-rental', 'camping-gear-rental', 'general-equipment-rental',

  // Amenities & Features
  'restrooms', 'showers', 'parking', 'free-parking', 'paid-parking', 'valet-parking',
  'picnic-area', 'bbq-grills', 'playground', 'visitor-center', 'information', 'atm',
  'gas-station', 'wifi', 'free-wifi', 'pet-friendly', 'wheelchair-accessible', 'spa',
  'wellness', 'yoga', 'family-activities',

  // Scenic
  'waterfall', 'scenic-viewpoint', 'lookout', 'panoramic-view', 'beach', 'black-sand-beach',
  'red-sand-beach', 'secluded-beach', 'clothing-optional-beach', 'coastline', 'cliffside',
  'sea-arch', 'forest', 'jungle', 'bamboo-forest', 'natural-landmark',
  'geological-formation', 'state-park', 'national-park',
];

export const PARKING_OPTIONS = ['none', 'limited', 'ample']; 