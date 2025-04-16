# MAHALO App Naming Conventions & Folder Structure

## Folder Structure

```
mahalo/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   ├── manifest.json
│   └── assets/
│       ├── icons/           # App icons and marker icons
│       └── images/          # Static images
├── src/
│   ├── components/          # Reusable components
│   │   ├── map/            # Map-related components
│   │   ├── admin/          # Admin panel components
│   │   ├── user/           # User profile/preferences components
│   │   └── common/         # Shared UI components
│   ├── pages/              # Full page components
│   ├── context/            # React context providers
│   ├── services/           # API and service integrations
│   ├── utils/              # Helper functions and constants
│   ├── hooks/              # Custom React hooks
│   ├── styles/             # Global styles and themes
│   ├── App.js              # Main App component
│   └── index.js            # Entry point
├── markdown/               # Documentation in markdown format
└── config/                 # Configuration files
```

## Naming Conventions

### Files and Folders

- **React Components**: PascalCase
  - Example: `MapContainer.js`, `AdminPanel.js`

- **Utility Functions & Hooks**: camelCase
  - Example: `useMapMarkers.js`, `formatDate.js`

- **Constants**: UPPER_SNAKE_CASE for values, PascalCase for files
  - Example: `MapConstants.js` containing `DEFAULT_ZOOM_LEVEL`

- **Context Files**: PascalCase with "Context" suffix
  - Example: `AuthContext.js`, `MapDataContext.js`

- **Service Files**: camelCase with "Service" suffix
  - Example: `firebaseService.js`, `mapboxService.js`

### Component Structure

```javascript
// Import statements
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// Component definition
function ComponentName({ prop1, prop2 }) {
  // State and hooks
  const [state, setState] = useState(initialValue);
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // Event handlers
  const handleEvent = () => {
    // Handler logic
  };
  
  // Component JSX
  return (
    <div className="component-name">
      {/* Component content */}
    </div>
  );
}

// PropTypes
ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

// Default props
ComponentName.defaultProps = {
  prop2: 0,
};

// Export
export default ComponentName;
```

### CSS/Styling

- **Component-specific CSS**: Same name as component with `.css` extension
  - Example: `MapContainer.css` for `MapContainer.js`

- **CSS Classes**: kebab-case
  - Example: `map-container`, `admin-panel-header`

- **CSS Variables**: kebab-case with `--` prefix
  - Example: `--primary-color`, `--header-height`

### JavaScript Conventions

- **Variables and Functions**: camelCase
  - Example: `getUserLocation()`, `mapCenter`

- **Boolean Variables**: Prefix with "is", "has", or "should"
  - Example: `isLoading`, `hasPermission`, `shouldRefresh`

- **Constants**: UPPER_SNAKE_CASE
  - Example: `DEFAULT_ZOOM`, `API_ENDPOINT`

- **Event Handlers**: Prefix with "handle" or "on"
  - Example: `handleClick`, `onMapLoad`

### React Component Props

- **Event Handler Props**: Prefix with "on"
  - Example: `onClick`, `onMapMarkerClick`

- **Boolean Props**: Prefix with "is", "has", or "should"
  - Example: `isDisabled`, `hasIcon`, `shouldAnimate`

- **Render Props**: Prefix with "render"
  - Example: `renderMarker`, `renderCustomControl`

## Firebase Data Structure

- **Collections**: PascalCase, plural
  - Example: `POIs`, `Users`, `Specials`

- **Document IDs**: auto-generated or semantic dash-case
  - Example: `beach-access-north`, `user-123`

- **Field Names**: camelCase
  - Example: `createdAt`, `locationName` 