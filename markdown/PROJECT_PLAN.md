# MAHALO App Development Plan

## Project Overview
A Maui-focused interactive map application that displays vendors, POIs, and events with detailed information, offline capabilities, and an admin panel for content management.

## Tech Stack
- React (JavaScript)
- Mapbox/OSM for map rendering
- Leaflet for map interactions
- Firebase for authentication and storage
- Mobile-first design approach

## Mobile Compatibility
- Responsive design using media queries and flexible layouts
- Touch-friendly UI elements (larger tap targets, swipe gestures)
- Progressive Web App (PWA) features for offline capability
- Viewport meta tag configuration for proper scaling
- Testing on both iOS and Android using local network access
- Avoid platform-specific APIs unless providing fallbacks

## Project Structure
```
src/
├── components/
│   ├── map/
│   │   ├── MapContainer.js
│   │   ├── MapDisplay.js
│   │   ├── Marker.js
│   │   └── DetailsModal.js
│   ├── admin/
│   │   ├── DataManager.js
│   │   ├── ItemForm.js
│   │   └── ItemList.js
│   ├── user/
│   │   ├── Favorites.js
│   │   ├── Routes.js
│   │   └── Profile.js
│   └── common/
│       ├── Header.js
│       ├── Footer.js
│       └── WeatherWidget.js
├── services/
│   ├── firebase.js
│   ├── mapService.js
│   ├── weatherService.js
│   └── storageService.js
├── context/
│   ├── AuthContext.js
│   └── AppDataContext.js
├── pages/
│   ├── HomePage.js
│   ├── AdminPage.js
│   └── DetailPage.js
├── utils/
│   ├── constants.js
│   └── helpers.js
├── App.js
└── index.js
```

## Data Models

### POI/Vendor/Event
```javascript
{
  id: String,
  name: String,
  type: String, // 'vendor', 'poi', 'event'
  description: String,
  location: {
    lat: Number,
    lng: Number
  },
  address: String,
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  images: [String], // URLs
  tags: [String], // Extensive predefined list for filtering/search (see utils/constants.js)
  customIcon: String, // URL
  modalLayout: String, // layout identifier
  animationEnabled: Boolean,
  activeSpecials: [SpecialId],
  openingHours: Object,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Special/Deal/Coupon
```javascript
{
  id: String,
  title: String,
  description: String,
  itemId: String, // reference to POI/Vendor
  validFrom: Timestamp,
  validTo: Timestamp,
  imageUrl: String,
  couponCode: String,
  createdAt: Timestamp
}
```

## Implementation Roadmap

### Phase 1: Setup & Core Map Functionality
1. Project initialization
2. Firebase integration *(Configuration corrected, Auth working)*
3. Basic map display with Mapbox
4. POI markers display

### Phase 2: Data Management & Admin Interface Foundation
1. POI data structure implementation
2. Details modal implementation (for map view)
3. Basic admin panel structure (`AdminPage`)
4. Item Listing component (`ItemList`) with data fetch (`queryItems`)
5. Item Form component (`ItemForm`) for creating new items
6. Navigation between Item List and Item Form
7. Data CRUD operations: Implement `createItem`, `getItem`, `queryItems` in Firestore service

### Phase 3: Editing, User Features & Storage
1. Implement item editing functionality: 
   - Load existing item data into `ItemForm` (`getItem`)
   - Implement `updateItem` in Firestore service and connect to form submission
2. Authentication *(Google Sign-in working, needs UI refinements)*
3. Implement Firebase Storage for image uploads (header, gallery)
4. Favorites/lists functionality
5. Route planning (basic)
6. Offline capabilities (basic data caching)

### Phase 4: Advanced Admin & Deals
1. Comprehensive admin dashboard (search, filter, sort items)
2. Deal management system (form, data model, CRUD)
3. Modal layout designer (if pursued)
4. Analytics dashboard (basic views)
5. Content management workflows

### Phase 5: Refinement & Optimization
1. Offline navigation
2. Performance optimization (data loading, rendering)
3. UI/UX refinement across the app
4. Comprehensive testing and bug fixes

## Key Dependencies
- react
- react-dom
- react-router-dom
- firebase
- mapbox-gl
- leaflet
- react-leaflet
- localforage (for offline storage) 




mapbox style: mapbox://styles/pathfindr/cm1dfx68z028i01q18dz5c8c1
mapbox token: pk.eyJ1IjoicGF0aGZpbmRyIiwiYSI6ImNtNXpnaWtxZDAyZGsya29vZno2eHZmdHkifQ.7y3kEVzLKOxlqAFAbdUktQ

firebase : AIzaSyAYReyOsNfW8Zsa1cUKFGSQOEnylDc_yNk

open weather : d2911ca189faa26226488b2c36cb10ca