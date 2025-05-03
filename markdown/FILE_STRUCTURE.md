# Project File Structure

This document outlines the file structure of the MAHALO project, provides descriptions for each directory and key file, and includes a Mermaid diagram illustrating the component flow.

## Directory Structure

```
/
├── markdown/                   # Documentation files
│   ├── APP_FLOW.md
│   ├── CHANGELOG.md
│   ├── CLOUD_FUNCTIONS_PROGRESS.md # Cloud Functions implementation status
│   ├── CONFIG_DETAILS.md
│   ├── CURRENT_TICKET.md
│   ├── FILE_STRUCTURE.md       <-- This file
│   ├── FIREBASE_IMPLEMENTATION.md
│   ├── NAMING_CONVENTIONS.md
│   ├── PROJECT_PLAN.md
│   └── tags.md
├── functions/                  # Firebase Cloud Functions
│   ├── index.js                # Main Cloud Functions implementation
│   ├── package.json            # Functions dependencies
│   ├── .eslintrc.js            # ESLint configuration for functions
│   └── README.md               # Functions documentation
├── public/                     # Static assets and index.html
│   └── index.html              # Main HTML page
├── src/                        # Application source code
│   ├── App.css                 # Global App component styles
│   ├── App.js                  # Main application component, handles routing
│   ├── index.css               # Global base styles
│   ├── index.js                # Application entry point, renders root component
│   ├── components/             # Reusable UI components
│   │   ├── admin/              # Components specific to the admin dashboard
│   │   │   ├── AdminDashboard.css
│   │   │   └── AdminDashboard.js # Main dashboard component for admin users
│   │   │   └── ItemList.js       # Component to display a list of items (likely in admin)
│   │   │   ├── NotificationsComponent.js # Displays admin notifications from Cloud Functions
│   │   │   ├── NotificationsComponent.css
│   │   │   ├── DealAnalytics.js # Displays analytics data for deals
│   │   │   └── DealAnalytics.css
│   │   ├── auth/               # Authentication related components
│   │   │   └── Login.js        # Login form component
│   │   ├── common/             # Common components used across the application
│   │   │   ├── Header.css
│   │   │   └── Header.js       # Application header component
│   │   │   ├── ImageUploader.css
│   │   │   └── ImageUploader.js # Component for uploading and managing images
│   │   │   ├── DraggableGallery.css
│   │   │   └── DraggableGallery.js # Component for reordering gallery images with drag-and-drop
│   │   ├── items/              # Components related to item display or forms
│   │   │   ├── ItemForm.css
│   │   │   └── ItemForm.js     # Comprehensive form for creating/editing items (details, location, tags, etc.).
│   │   ├── map/                # Components related to map display/interaction
│   │   │   └── MapPicker.js    # Mapbox GL component for selecting coords via map click/drag, geolocation, or manual input.
│   │   └── MapContainer.js     # Main Mapbox GL map view component, displaying user location, items, and search bar.
│   │   ├── MapSearchBar.js   # Search input component with suggestion popover for the map.
│   │   └── MapSearchBar.css  # Styles for the MapSearchBar.
│   ├── context/                # React context providers
│   │   └── AuthContext.js      # Context for managing authentication state
│   ├── pages/                  # Page-level components (containers for features)
│   │   ├── AdminPage.js        # Alternative item management page (unused in current App.js routing).
│   │   ├── DetailPage.js       # Placeholder page for displaying item details.
│   │   ├── HomePage.js         # Page component that renders the main MapContainer view.
│   │   ├── ItemManagementPage.css
│   │   └── ItemManagementPage.js # Page wrapper for creating/editing items using ItemForm.
│   ├── services/               # Business logic, API calls, external services
│   │   ├── firebase.js         # Firebase configuration and initialization
│   │   ├── firestoreService.js # Provides CRUD functions for the `Items` collection
│   │   ├── cloudFunctionsService.js # Provides methods to interact with Cloud Functions
│   │   └── storageService.js   # Handles Firebase Storage operations for image uploads
│   ├── styles/                 # Global or shared styles (potential overlap with index.css/App.css)
│   │   ├── App.css             # (Duplicate or specific App styles?)
│   │   ├── MapContainer.css
│   │   └── index.css           # (Duplicate or specific index styles?)
│   └── utils/                  # Utility functions and constants
│       └── constants.js        # Application-wide constants
├── .gitignore                  # Specifies intentionally untracked files that Git should ignore
├── package-lock.json           # Records exact versions of dependencies
└── package.json                # Project metadata and dependencies
```

## File/Directory Descriptions

*   **`markdown/`**: Contains all project documentation, including planning, implementation details, conventions, and this structure guide.
*   **`functions/`**: Contains files related to Firebase Cloud Functions.
    *   **`index.js`**: Main Cloud Functions implementation.
    *   **`package.json`**: Functions dependencies.
    *   **`.eslintrc.js`**: ESLint configuration for functions.
    *   **`README.md`**: Functions documentation.
*   **`public/`**: Holds static assets served directly by the webserver. `index.html` is the entry point for the browser.
*   **`src/`**: Core directory containing all the React application's source code.
    *   **`App.css`**: Styles specific to the main `App` component.
    *   **`App.js`**: The root component of the React application. It sets up routing using `react-router-dom` (handling routes like `/`, `/login`, and `/admin/*`), manages a loading state based on authentication, and defines a `ProtectedRoute` component. It orchestrates the main layout, including the `Header` and the main content area where components like `Login` or `AdminDashboard` are rendered based on the URL and authentication status provided by `AuthContext`.
    *   **`index.css`**: Global CSS styles applied to the entire application (e.g., resets, base typography).
    *   **`index.js`**: The JavaScript entry point. It renders the `App` component into the DOM, wrapped with necessary providers like `React.StrictMode`, `BrowserRouter`, and `AuthProvider`.
    *   **`components/`**: Contains reusable UI pieces.
        *   **`admin/`**: Components used exclusively within the administrative sections of the application.
            *   `AdminDashboard.js`: The main view for administrators, likely containing tools for managing items, users, etc. Includes tabs for different sections (Items, Analytics, Deals). Uses a Modal for creating/editing items via `ItemForm`.
            *   `ItemList.js`: Displays a list of items with filtering/sorting. Shows item icon/logo and includes options to edit or trigger creation.
        *   **`auth/`**: Components related to user authentication.
            *   `Login.js`: Provides the user interface for logging in.
        *   **`common/`**: Components shared across different parts of the application.
            *   `Header.js`: The site-wide header, likely displaying navigation, user status, and logout options.
            *   `ImageUploader.js`: Allows users to upload single or multiple images to Firebase Storage, with preview, delete, and edit functionality.
            *   `DraggableGallery.js`: Provides drag-and-drop functionality for reordering gallery images using @dnd-kit libraries.
        *   **`items/`**: Components specifically for handling 'items' (products, listings, etc.).
            *   `ItemForm.js`: A large, multi-section form component responsible for both creating new items and editing existing ones. Manages complex nested state including presentation details like custom logo uploads (`logoUrl`) and React Icon selection (`icon`). Integrates `MapPicker`, `ImageUploader`, `IconPickerModal`, and handles submission via `firestoreService`.
        *   **`map/`**: Components related to map features.
            *   `MapPicker.js`: Integrates Mapbox GL JS to provide an interactive map for coordinate selection. Allows users to set latitude/longitude by clicking the map, dragging a marker, using browser geolocation, or entering values manually into input fields. Handles initial coordinates, bounds checking (Maui), map initialization/cleanup, and calls back with the selected location.
            *   `MapContainer.js`: The primary map component using Mapbox GL JS. Initializes the map, displays items from Firestore as markers (using custom logo, React Icon, or fallback), handles user location, integrates the `MapSearchBar`, and opens `ItemDetailModal` on marker click.
            *   `MapSearchBar.js`: Provides a search input field positioned over the map. Includes debouncing, calls `firestoreService.searchItems`, and displays results/suggestions in an MUI Popper. Triggers map navigation on result selection.
            *   `MapSearchBar.css`: Contains positioning and styling rules for the `MapSearchBar` component and its Popper.
    *   **`context/`**: Holds React Context API implementations for global state management.
        *   `AuthContext.js`: Provides authentication state (current user, loading status, error) and functions (login, loginWithGoogle, logout, resetPassword, updateProfile) to components throughout the app via the `useAuth` hook.
    *   **`pages/`**: Intended for top-level components representing distinct application pages or views. *Note: Current routing seems handled directly in `App.js` referencing components, making some page components potentially unused or placeholders.*
        *   `AdminPage.js`: An alternative implementation for an item management page, allowing users to switch between viewing `ItemList` and `ItemForm`. Currently not used in the primary routing defined in `App.js` (which uses `AdminDashboard`).
        *   `DetailPage.js`: A basic placeholder component intended to display details for a specific item ID, fetched via URL parameters. Currently unused.
        *   `HomePage.js`: A simple page component whose primary role is to render the `MapContainer` component, serving as the main map view of the application.
        *   `ItemManagementPage.js`: Provides a dedicated page view for the `ItemForm` component, handling surrounding UI elements like titles, descriptions, post-submission notifications, and navigation.
    *   **`services/`**: Contains modules for handling side effects, external API interactions, and business logic.
        *   `firebase.js`: Configures and initializes the Firebase SDK.
        *   `firestoreService.js`: Provides CRUD (Create, Read, Update, Delete) functions specifically for the `Items` and `Deals` collections in Firestore, including automatic timestamp handling and item searching (`searchItems`).
        *   `cloudFunctionsService.js`: Provides methods to interact with Cloud Functions.
        *   `storageService.js`: Handles interactions with Firebase Storage, including uploading, deleting, and retrieving images.
    *   **`styles/`**: Contains additional CSS files. *Note: There might be overlap or redundancy with `index.css` and `App.css` at the root `src` level. Consolidating might be beneficial.*
    *   **`utils/`**: Holds miscellaneous helper functions, constants, or common utilities.
        *   `constants.js`: Defines shared constant values (e.g., API keys, map settings, POI types, tags, error messages) used elsewhere in the application.
*   **`.gitignore`**: Lists files and directories (like `node_modules`) that should not be tracked by Git.
*   **`package-lock.json`**: Automatically generated file that locks down the exact versions of dependencies used, ensuring consistent installs.
*   **`package.json`**: Defines project metadata, scripts (like `start`, `build`), and lists dependencies.

## Component Flow / Routing (Mermaid Diagram)

```mermaid
graph TD
    subgraph Browser
        U[User]
    end

    subgraph AppEntry
        IDX[index.js] --> RT[BrowserRouter]
        RT --> AU[AuthProvider]
        AU --> APP[App.js]
    end

    subgraph AppLayout
        APP --> HDR[Header.js]
        APP --> ROUTES{Routes}
    end

    subgraph Authentication
        AUTHCTX[AuthContext.js]
        LOGIN[Login.js]
        PROT{ProtectedRoute}
    end

    subgraph Services
        FBCONFIG[firebase.js]
        FS[firestoreService.js]
    end

    subgraph AdminSection
        ADMDB[AdminDashboard.js]
        ITL[ItemList.js]
        ITF[ItemForm.js]
    end

    subgraph MapSection
        MAPC[MapContainer.js]
        MAPP[MapPicker.js]
    end

    U --> IDX
    APP -.-> AUTHCTX
    HDR -.-> AUTHCTX
    ROUTES -- Route / --> MAP_VIEW(Map View Placeholder)
    ROUTES -- Route /login --> LOGIN
    ROUTES -- Route /admin/* --> PROT
    PROT -- Authenticated --> ADMDB
    PROT -- Not Authenticated --> LOGIN

    LOGIN -- On Success --> Redirect to /admin/items or intended route

    ADMDB --> ITL
    ADMDB -- Create/Edit Click --> ITF(Modal)
    ITL -- Edit Click --> ITF(Modal)
    ITF -- Submits Data --> FS
    FS --> FBCONFIG

    %% Placeholder for future map integration
    %% MAP_VIEW --> MAPC
    %% MAPC --> MAPP

    classDef page fill:#f9f,stroke:#333,stroke-width:2px;
    classDef component fill:#ccf,stroke:#333,stroke-width:1px;
    classDef context fill:#cfc,stroke:#333,stroke-width:1px;
    classDef service fill:#fcc,stroke:#333,stroke-width:1px;
    classDef entry fill:#eee,stroke:#333,stroke-width:1px;

    class IDX,RT,AU entry;
    class APP,HDR,ROUTES,LOGIN,PROT,ADMDB,ITL,ITF,MAPC,MAPP component;
    class AUTHCTX context;
    class FS,FBCONFIG service;
    class MAP_VIEW page;

```

This diagram illustrates:
- The application entry point (`index.js`) setting up routing and authentication context.
- The main `App.js` component rendering the `Header` and defining `Routes`.
- How routing directs users to either the `Login` page or protected components like `AdminDashboard` based on authentication status managed by `AuthContext`.
- The relationship between `AdminDashboard`, `ItemList`, and the modal `ItemForm`.
- How `ItemForm` utilizes `firestoreService` for data operations.
- Placeholders for map components.

This structure and flow should provide a clear overview of the project. It can be updated as the project evolves. 