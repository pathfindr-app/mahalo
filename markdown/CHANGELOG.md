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

- Core Components
  - Created main App component with React Router setup
  - Implemented basic page components:
    - HomePage with placeholder for map
    - AdminPage with dashboard structure
    - DetailPage with route parameter support

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

- Added configuration details documentation (`markdown/CONFIG_DETAILS.md`)
- Planned development of a comprehensive item management dashboard including item listing, searching, and editing capabilities.

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

### Fixed
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

## [0.1.0] - 2024-03-XX
- Initial project setup and basic structure implementation 