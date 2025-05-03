# MAHALO App Changelog

All notable changes to the MAHALO project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup and documentation
  - Created comprehensive project plan (PROJECT_PLAN.md)
  - Added application flow diagrams (APP_FLOW.md)
  - Established naming conventions (NAMING_CONVENTIONS.md)
  - Set up changelog tracking (CHANGELOG.md)
  - Defined item management system structure (CURRENT_TICKET.md)

- Project Structure
  - Initialized basic folder structure following naming conventions
  - Set up public directory with initial HTML template
  - Created src directory with component organization

- Dependencies
  - Set up package.json with core dependencies:
    - React and React DOM
    - React Router for navigation
    - Firebase for backend services
    - Mapbox GL and Leaflet for map functionality
    - Material UI for components
    - LocalForage for offline storage
    - @dnd-kit libraries for drag and drop functionality

- Core Components
  - Created main App component with React Router setup
  - Implemented basic page components:
    - HomePage with placeholder for map
    - AdminPage with dashboard structure
    - DetailPage with route parameter support
  - **Map Search Bar:**
    - Created `MapSearchBar` component (`src/components/map/MapSearchBar.js`) with MUI `TextField` and `Popper`.
    - Implemented basic search input with debouncing.
    - Added `searchItems` function to `firestoreService.js` for prefix-based item name searching.
    - Integrated `MapSearchBar` into `MapContainer.js`.
    - Added basic popover display for search suggestions.
    - Implemented map navigation (`flyTo`) on search result selection.

- Configuration
  - Added API keys and tokens for:
    - Mapbox
    - Firebase
    - OpenWeather
  - Set up environment configuration

- Firebase Authentication
  - Implemented Firebase configuration and initialization
  - Created AuthContext with Google Sign-in support
  - Added protected route functionality
  - Implemented login page with Google authentication
  - Set up user state management and error handling
  - Added route protection for admin pages

- Map Implementation
  - Created MapContainer component with Mapbox GL integration
  - Implemented basic map controls (zoom, pan, scale)
  - Added mobile-responsive design
  - Included coordinate display overlay
  - Set up initial map styling with custom Mapbox style
  - Added error handling and loading states
  - Implemented proper map cleanup on component unmount
  - Enhanced map container styling for better rendering
  - Set default map center to Maui with zoom level 9
  - Added real-time user location tracking with marker and accuracy radius
  - Implemented geolocation error handling
  - Optimized map rendering and performance for smooth panning and zooming
  - Enhanced marker positioning to stay locked to GPS coordinates
  - Improved map interaction with hardware-accelerated rendering

- Item Management Planning
  - Defined Firebase collections structure for Items, Categories, and Tags
  - Outlined security rules requirements
  - Specified indexing requirements for efficient queries
  - Planned integration points with map and admin interface
  - Created implementation roadmap

- Item Form Enhancements
  - Added coordinate display and manual input to MapPicker component
  - Replaced EmojiPicker with placeholder text input for icon selection
  - Defined ACTIVITY_TAGS constant in utils/constants.js
  - Implemented multi-select checkbox group for Activity Tags in ItemForm
  - Added tags field to form state and submission data
  - Implemented rich text editor using Draft.js and react-draft-wysiwyg for detailed descriptions
  - Added ImageUploader component for header and gallery images with Firebase Storage integration
  - Created DraggableGallery component with drag-and-drop functionality for reordering gallery images
  - Enhanced parking information section with MapPicker for parking coordinates

- Added configuration details documentation (`markdown/CONFIG_DETAILS.md`)
- Planned development of a comprehensive item management dashboard including item listing, searching, and editing capabilities.

- Cloud Functions implementation for deal analytics, real-time updates, and background processing
- Client-side service for interacting with Cloud Functions
- UI components for notifications and analytics display
- Added detailed documentation in CLOUD_FUNCTIONS_PROGRESS.md

- Deal Management Implementation
  - Created DealForm component with rich text editing for description and terms
  - Added DealList component with filtering, sorting, and search capabilities
  - Implemented date pickers for deal validity period using @mui/x-date-pickers
  - Created Firebase service functions for deal CRUD operations
  - Added vendor selection to link deals with vendor items
  - Implemented deal analytics structure with claims tracking
  - Added deal status tracking (Active/Inactive/Expired/Fully Claimed)
  - Enhanced AdminDashboard with integrated deal management tab
- **Icon Strategy Enhancement:**
  - Added support for uploading custom vendor logos to Firebase Storage via `ItemForm`.
  - Implemented priority-based display logic (Logo > React Icon > Category Icon) in map markers (`MapContainer`), item list (`ItemList`), and item detail modal (`ItemDetailModal`).

### Changed
- Updated import statements to use .js extensions for ES modules compatibility
- Modified package.json to use "type": "module" for ES module support
- Improved map initialization with async/await pattern
- Enhanced map loading and error states
- Optimized location tracking with proper cleanup
- Updated Firebase implementation to use Google authentication instead of email/password
- Improved ItemForm styling for better layout and visual hierarchy
- Refactored MapPicker useEffect hooks to separate initialization and updates
- Replaced basic tag checkbox group with searchable multi-select component (`react-select`) in `ItemForm`.
- Updated `ItemForm` to use comprehensive `ALL_TAGS` list from `constants.js`.
- Restructured ItemForm into logical sections with conditional rendering based on item type
- Enhanced Image management with proper ordering, preview functionality, and deletion options
- Updated map configuration to use a lighter style for better performance
- Modified map boundaries to allow viewing a larger area around Maui
- Changed zoom behavior to enable standard mousewheel zoom without requiring Ctrl key
- Optimized marker creation process to update existing markers instead of recreating them
- Enhanced CSS with hardware acceleration techniques for smoother rendering
- **Components Updated for Icon Logic:** Modified `ItemForm`, `MapContainer`, `ItemList`, and `ItemDetailModal` to support and display custom logos and React Icons.

### Fixed
- **Deal Display in Modal:** Fixed `ItemDetailModal` not displaying deal validity dates and claim counts.
  - Updated `formatDate` helper to correctly handle Firestore Timestamp objects.
  - Corrected field access in `DealsBlock` to use `validity.startDate`, `validity.endDate`, `analytics.currentlyClaimed`, and `limits.maxClaims` based on actual data structure.
- Resolved module resolution errors by adding explicit .js extensions to imports
- Fixed routing configuration in App.js
- Addressed map initialization race conditions
- Fixed user location marker and accuracy circle updates
- Resolved memory leaks in map cleanup
- Fixed MapPicker re-render loop caused by function dependencies in useEffect
- Corrected CSS conflicts causing coordinate inputs to be hidden
- Restored accidentally deleted CSS rules for map errors and tag checkboxes
- Adjusted z-index values in ItemForm.css to ensure map controls render above map canvas
- Resolved Google Sign-in `redirect_uri_mismatch` error by correcting Firebase/Google Cloud OAuth configuration.
- Corrected `firebase.js` configuration to match the active `MahaloRewardsCard` Firebase project.
- Fixed React warnings about trying to update state on unmounted components:
  - Added isMountedRef to both ItemForm and MapPicker components
  - Implemented proper cleanup on component unmount to set the flag to false
  - Added checks before all state updates to prevent setState calls after unmounting
  - Applied the pattern to all asynchronous operations to prevent memory leaks
- Fixed DealForm by changing reference from 'createDeal' to 'addDeal' to match the existing function in firestoreService
- Fixed critical issue with deals not saving to Firestore:
  - Corrected collection references in firestoreService.js to use the proper 'Deals' collection
  - Fixed inconsistency where deals were being saved to 'Items' collection but queried from 'Deals'
  - Added proper dealsCollectionRef initialization
  - Enhanced deal data structure with proper analytics and status fields
- Fixed map performance issues:
  - Resolved marker positioning problems where icons would slide during map panning
  - Fixed jank and stuttering when panning around the map
  - Removed accuracy circle around user location that was affecting map zoom out
  - Optimized rendering during map movement to prevent performance degradation
  - Fixed mousewheel zoom requiring Ctrl key modifier
  - Resolved map reinitialization issues caused by improper dependency arrays
  - Added intelligent marker management to prevent unnecessary redraws
  - Implemented proper state updates to prevent excessive re-rendering during map interaction
- **Map Performance:** Significantly improved map performance and user experience
  - Fixed markers not staying locked to their GPS coordinates during map panning
  - Removed distracting accuracy circle around user location
  - Fixed janky/stuttering behavior when panning the map
  - Enabled standard mousewheel zoom without requiring Ctrl key
  - Extended zoom out capability to see more of the map area
- **Map Rendering:** Enhanced map rendering with hardware acceleration
  - Added CSS optimizations for smoother marker rendering
  - Implemented more efficient marker management
  - Changed to a lighter map style for better performance
  - Added intelligent viewport updates to reduce unnecessary state changes

## [0.1.0] - 2024-03-XX
- Initial project setup and basic structure implementation

## 2024-04-24
### Fixed
- **Critical:** Fixed Firebase admin authentication by ensuring admin claims were set on the correct project
- **Security:** Properly deployed Firestore security rules to the correct Firebase project (mahalorewardscard)
- **Configuration:** Updated Firebase CLI configuration to use the correct project
- **Documentation:** Added detailed notes in CONFIG_DETAILS.md and FIREBASE_IMPLEMENTATION.md about project configuration
- **Admin Workflow:** Created and documented process for setting admin privileges via Firebase Admin SDK
### Added
- Created AdminCheck component for verifying admin status
- Added token refresh functionality for admin authentication 

## 2024-05-13
### Fixed
- **Map Performance:** Significantly improved map performance and user experience
  - Fixed markers not staying locked to their GPS coordinates during map panning
  - Removed distracting accuracy circle around user location
  - Fixed janky/stuttering behavior when panning the map
  - Enabled standard mousewheel zoom without requiring Ctrl key
  - Extended zoom out capability to see more of the map area
### Changed
- **Map Rendering:** Enhanced map rendering with hardware acceleration
  - Added CSS optimizations for smoother marker rendering
  - Implemented more efficient marker management
  - Changed to a lighter map style for better performance
  - Added intelligent viewport updates to reduce unnecessary state changes 