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
  'surfing', 'surf-lessons', 'beginner-surf', 'advanced-surf', 'surfing-spot', 'wave-break', 
  'windsurfing', 'kitesurfing', 'kite-surf', 'foiling', 'stand-up-paddle', 'sup-rental',
  'snorkeling', 'freediving', 'scuba-diving', 'dive-shop', 'dive-charter', 'underwater-scooter',
  'kayaking', 'kayak-rental', 'canoeing', 'canoe-rental', 'boat-tour', 'glass-bottom-boat', 
  'submarine-tour', 'whale-watching', 'dolphin-watching', 'sunset-cruise', 'sailing', 
  'fishing-charter', 'fishing-spot', 'jet-ski', 'parasailing', 'swimming', 'calm-water',
  'beach-lounging', 'tide-pooling', 'skim-boarding', 'boogie-boarding', 'lifeguard-on-duty',
  'beach-club',

  // Land Activities
  'hiking', 'guided-hike', 'trail-running', 'nature-walk', 'coastal-trail', 'waterfall-hike',
  'camping', 'backpacking', 'picnic-spot', 'picnic-area', 'bbq-grills',
  'biking', 'mountain-biking', 'road-cycling', 'bike-rental', 'scenic-drive',
  'horseback-riding', 'atv-tours', 'off-road-trails', 'ziplining', 'adventure-park', 
  'rappelling', 'rock-climbing', 'cave-exploration',
  'golfing', 'disc-golf', 'bocce-ball', 'volleyball',
  'stargazing', 'sunrise-viewing', 'sunset-viewing', 'viewpoint', 'lookout', 'photography-spot',
  'bird-watching', 'farm-tour', 'plantation-visit', 'coffee-plantation', 'fruit-stand',
  'botanical-garden', 'distillery-tour', 'winery-tour', 'brewery-tour',
  'volcano-viewing', 'haleakala', 'lava-tube', 'lava-field', 'geological-formation',

  // Culture & History
  'cultural-center', 'museum', 'historical-site', 'landmark', 'historic-building', 'national-monument',
  'state-monument', 'church', 'temple', 'war-memorial', 'archaeological-site', 'ancient-site',
  'luau', 'hula-show', 'polynesian-culture', 'storytelling',
  'live-music', 'local-music', 'concert', 'live-entertainment',
  'art-gallery', 'art-studio', 'local-art', 'craft-fair', 'handmade-goods', 'art-class', 
  'pottery-class', 'lei-making', 'ukulele-lessons', 
  'historic-town', 'walking-tour', 'community-event', 'local-festival', 'farmers-market', 
  'petroglyphs', 'oddity',

  // Food & Drink
  'restaurant', 'cafe', 'coffee-shop', 'bakery', 'bar', 'brewery', 'winery', 'distillery',
  'cocktail-lounge', 'rooftop-bar', 'wine-bar', 'sports-bar',
  'food-truck', 'roadside-stand', 'farmers-market', 'food-court', 'grab-and-go', 'deli',
  'local-cuisine', 'hawaiian-food', 'plate-lunch', 'poke', 'loco-moco', 'malasadas', 'butter-mochi',
  'seafood', 'fresh-fish', 'fish-tacos', 'sushi',
  'ramen', 'thai-food', 'pizza', 'tacos', 
  'fine-dining', 'casual-dining', 'family-friendly', 'romantic', 'outdoor-seating', 'patio-dining',
  'vegetarian', 'vegan', 'gluten-free', 'allergy-friendly', 'vegetarian-options', 'vegan-options', 'gluten-free-options',
  'shave-ice', 'ice-cream', 'acai-bowl', 'smoothie', 'juice-bar', 
  'breakfast', 'brunch', 'lunch', 'dinner', 'late-night-food',
  'happy-hour', 'byob', 'ocean-view-dining', 'picnic-supplies',

  // Shopping
  'souvenirs', 'gifts', 'clothing-boutique', 'surf-shop', 'resort-wear', 'vintage-clothing',
  'local-crafts', 'handmade-goods', 'local-designers', 'jewelry', 'art-supplies',
  'grocery', 'convenience-store', 'pharmacy', 'hardware-store', 'bookstore', 'music-store',
  'shopping-center', 'outlet-mall', 'flea-market', 'luxury-goods',
  'outdoor-gear', 'tackle-shop', 'camping-gear', 'hiking-gear',

  // Rentals
  'car-rental', 'motorcycle-rental', 'scooter-rental', 'moped-rental', 'van-rental', 'golf-cart-rental',
  'bike-rental', 'kayak-rental', 'canoe-rental', 'sup-rental', 'surfboard-rental', 
  'boogie-board-rental', 'skim-board-rental', 'snorkel-rental', 'dive-gear-rental', 
  'beach-chair-rental', 'umbrella-rental', 'beach-gear-rental', 'fishing-gear-rental',
  'camping-gear-rental', 'hiking-gear-rental', 'baby-gear-rental', 'camera-rental', 
  'underwater-camera-rental', 'wheelchair-rental', 'general-equipment-rental',

  // Amenities & Features
  'restrooms', 'showers', 'changing-rooms', 'family-restroom', 'drinking-water', 'lockers',
  'parking', 'free-parking', 'paid-parking', 'valet-parking', 'visitor-parking', 'overflow-parking', 'ev-charging', 'bike-rack',
  'picnic-area', 'bbq-grills', 'playground', 'dog-park', 'dog-waste-station',
  'visitor-center', 'information', 'first-aid', 'lost-and-found', 'atm', 'gas-station', 
  'wifi', 'free-wifi', 'public-transport-stop', 'pet-friendly', 'wheelchair-accessible', 'accessible-trail',
  'spa', 'wellness', 'yoga', 'family-activities', 'lookout-tower', 'fishing-pier', 'boat-launch', 'kayak-launch',

  // Scenic
  'waterfall', 'scenic-viewpoint', 'lookout', 'panoramic-view', 'mountain-view', 'valley-view', 'coastline', 'cliffside', 
  'beach', 'black-sand-beach', 'red-sand-beach', 'secluded-beach', 'clothing-optional-beach', 'tide-pools',
  'sea-arch', 'natural-bridge', 'blowhole', 'lava-tube', 'lava-field', 'crater', 'geological-formation', 'natural-landmark',
  'forest', 'jungle', 'bamboo-forest', 'unique-flora', 'unique-fauna', 
  'sunset-spot', 'sunrise-spot', 'photo-spot', 'hidden-gem', 'scenic-route', 
  'state-park', 'national-park',
];

export const PARKING_OPTIONS = ['none', 'limited', 'ample']; 