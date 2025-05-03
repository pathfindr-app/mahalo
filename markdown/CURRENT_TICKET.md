# Item Management System Implementation

## Overview
Implementation of a comprehensive item (POI/Vendor) management system with an intuitive form interface, deal management, and analytics tracking.

## Form Flow

1. Initial Selection
   - Type selection (Vendor/POI)
   - GPS coordinate input (map picker interface)
   - Icon selection (emoji picker for MVP)

2. Basic Information
   - Name
   - Brief description (for map tooltips)
   - Detailed description (rich text)
   - Best time to visit
   - Weather considerations

3. Location Details
   - Parking information
     - Availability (None/Limited/Ample)
     - Location description
     - Coordinates of parking area
     - Cost information

4. Vendor-Specific (if type === 'vendor')
   - Deal Management
     - Deal title
     - Description
     - Valid period
     - Maximum claims
     - Terms and conditions
   - Deal Analytics
     - Total available
     - Currently claimed
     - Claim rate
     - Peak claim times
     - User engagement metrics

5. Visual Presentation
   - Container styling
     - Background opacity (0-100%)
     - Blur effect (0-20px)
     - Background color
   - Header image upload
   - Gallery images upload (for carousel)
   - Display order for gallery

## Completed Work / Recent Fixes

- **Implemented Item Listing:** Created `ItemList.js` with search and filter capabilities.
- **Navigation:** Set up navigation between `AdminDashboard`, `ItemList`, and `ItemForm`.
- **GPS Input:** Enhanced GPS input using `MapPicker`.
- **Firebase Setup:** Established basic Firebase connection and tested item creation/update.
- **Edit Mode:** Implemented edit functionality in `ItemForm` with data pre-population.
- **Rich Text:** Added rich text editor (`react-draft-wysiwyg`) for detailed descriptions.
- **Image Uploads:** Created `ImageUploader` component and `storageService.js` for Firebase Storage.
- **Gallery Order:** Implemented drag-and-drop reordering for gallery images using `@dnd-kit`.
- **Parking Info:** Added parking details section with coordinate picker.
- **Presentation:** Included style controls (opacity, blur, color).
- **Tag Selection:** Added searchable dropdown for tag selection.
- **Deal Management:** Created `DealForm`, `DealList`, and Firestore services for deals.
- **Validation & Errors:** Added form validation (coordinates, etc.) and error handling.
- **Loading/Notifications:** Implemented basic loading states and notifications.
- **Unmounted State Fix:** Addressed React warnings for `setState` on unmounted components using `isMountedRef`.
- **Image Uploader ID Conflict:** Fixed a bug where the gallery image uploader triggered the header image uploader. This was caused by duplicate HTML `id` attributes on the file input elements within multiple `ImageUploader` instances. Resolved by adding a unique `idSuffix` prop to `ImageUploader` and passing distinct values ('header', 'gallery') from `ItemForm.js`.
- **React Icons Integration:** Replaced text/emoji icon input in `ItemForm` with a modal (`IconPickerModal`) allowing selection from `react-icons`. Updated `MapContainer` to render the selected React Icon component as the map marker instead of the icon name string. Fixed `react-icons/all` import issue.
- **Designable Item Detail Modal (Phase 1):**
  - Integrated `react-grid-layout` into `ItemDetailModal.js`.
  - Added "Design Mode" toggle for admins, allowing dragging and resizing of content blocks (Details, Gallery, Location, Parking, Deals, Tags, etc.).
  - Layout configuration is saved to Firestore under `item.presentation.modalLayout`.
  - Modal now loads saved layouts or uses a default layout.
  - Integrated modal opening on marker click in `MapContainer.js`.
  - Fixed admin status detection in `AuthContext.js` to correctly show design controls.
  - Added basic styling and enabled vertical compaction for better usability.
  - Created `markdown/DESIGNING_MODALS.md` for detailed implementation plan and progress.
  - **Fixed Deal Display:** Resolved issues in `ItemDetailModal` preventing deal validity dates and claim counts from displaying correctly by handling Firestore Timestamps and using correct field names (`validity.startDate`, `validity.endDate`, `analytics.currentlyClaimed`, `limits.maxClaims`).
- **Icon Functionality (Logo Upload & Display):**
  - Added functionality to `ItemForm` to upload a custom vendor logo (`presentation.logoUrl`) via `ImageUploader` and Firebase Storage.
  - Updated `MapContainer`, `ItemList`, and `ItemDetailModal` to display icons/logos based on priority: Custom Logo > React Icon > Category Icon (Fallback).

## Firebase Collections Structure

### Items Collection (`Items`)
```javascript
{
  id: string,                 // Auto-generated or custom semantic ID
  type: string,              // 'vendor' | 'poi'
  name: string,              // Display name
  description: {
    brief: string,           // For map tooltips
    detailed: string,        // Rich text full description
    bestTime: string,        // Best time to visit
    weatherNotes: string     // Weather considerations
  },
  location: {
    coordinates: {
      lat: number,
      lng: number
    },
    parking: {
      availability: string,  // 'none' | 'limited' | 'ample'
      description: string,
      coordinates: {
        lat: number,
        lng: number
      },
      cost: string
    }
  },
  presentation: {
    icon: string,            // React Icon name (e.g., 'FaBeer') or fallback category icon name
    logoUrl: string | null,  // URL for uploaded custom logo (via Firebase Storage) - Takes precedence over icon
    container: {
      opacity: number,       // 0-100
      blur: number,         // 0-20
      backgroundColor: string
    },
    headerImage: {
      url: string,
      alt: string
    },
    gallery: [
      {
        url: string,
        alt: string,
        order: number
      }
    ]
    // modalLayout: Object | null // DEPRECATED: Removed in favor of fixed MUI Grid layout in ItemDetailModal.js
  },
  tags: [String],          // Extensive predefined list for filtering/search (see utils/constants.js)
  status: {
    isActive: boolean,
    lastUpdated: timestamp,
    createdAt: timestamp,
    updatedBy: string
  }
}
```

### Deals Collection (`Deals`)
```javascript
{
  id: string,
  itemId: string,           // Reference to vendor
  title: string,
  description: string,
  terms: string,
  validity: {
    startDate: timestamp,
    endDate: timestamp
  },
  limits: {
    maxClaims: number,
    perUserLimit: number
  },
  analytics: {
    totalAvailable: number,
    currentlyClaimed: number,
    claimHistory: [
      {
        timestamp: timestamp,
        userId: string
      }
    ],
    peakTimes: {
      // Updated by Cloud Function
      dayOfWeek: number,
      timeOfDay: string,
      claimCount: number
    }[]
  },
  status: {
    isActive: boolean,
    lastUpdated: timestamp
  }
}
```

### Future Schema Additions (Proposed)

#### Reviews Collection (`Reviews`)
*   **Purpose:** Store user-submitted reviews and ratings for items. Kept separate for scalability.
*   **Structure:**
```javascript
{
  reviewId: string,       // Auto-generated
  itemId: string,         // Foreign key linking to the Item
  userId: string,         // Foreign key linking to the User who wrote it
  rating: number,         // e.g., 1-5
  text: string,           // The review content
  createdAt: timestamp,
  status: string          // e.g., 'pending', 'approved', 'rejected' (for moderation)
}
```
*   **Denormalization Potential:** A Cloud Function could update `averageRating` and `reviewCount` fields on the corresponding `Item` document whenever a review status changes to `approved` or is deleted, optimizing reads for lists/maps.

#### Events Collection (`Events`)
*   **Purpose:** Store event information associated with items (typically vendors/venues).
*   **Structure:**
```javascript
{
  eventId: string,        // Auto-generated
  itemId: string,         // Foreign key linking to the Item (vendor/venue)
  name: string,
  description: string,
  startTime: timestamp,
  endTime: timestamp,
  tags: [string],         // e.g., ['music', 'live', 'outdoor']
  coverImage: string | null, // URL (optional)
  status: string          // e.g., 'scheduled', 'cancelled'
}
```
*   **Considerations:** Allows querying events by date range, location (via the linked item's location), or tags.

## Implementation Plan

### Phase 1: Basic Form & Listing Setup
1. [X] Create form container component *(ItemManagementPage.js/ItemForm.js)*
2. [X] Implement basic Item Listing view (table or cards) to display existing items *(Created ItemList.js)*
3. [X] Add search/filter functionality to the Item List view
4. [X] Implement navigation from Item List to Item Form (for creating new items) *(Connected via AdminDashboard)*
5. [X] Implement selection of an item from the list to load its data for editing *(Connected via AdminDashboard and ItemForm)*
6. [X] Improve GPS input (Map picker with coordinate display/manual entry)
7. [X] Replace emoji picker with text input placeholder
8. [X] Set up basic Firebase connection *(Successfully tested basic Item creation)*

### Phase 2: Editing & Enhanced Form Features
1. [X] Implement 'Edit Item' mode in the ItemForm, pre-populating with selected item's data *(Verified)*
2. [X] Implement Firebase `updateItem` function call on form submission in edit mode *(Verified)*
3. [X] Add rich text editor for detailed description
4. [X] Create image upload system with Firebase Storage (for header/gallery)
5. [X] Implement gallery order management
6. [X] Add parking information section
7. [X] Create presentation style controls *(Added opacity/blur sliders)*
8. [X] Implement selection system for expanded tags (UI may need update, e.g., searchable dropdown)

### Phase 3: Deal Management
1. [X] Create deal form component
2. [X] Set up deals collection in Firebase
3. [X] Implement deal validation logic
4. [X] Add deal analytics structure
5. [X] Create deal status tracking

### Phase 4: Analytics & Cloud Functions
1. [ ] Set up Cloud Functions for analytics
2. [ ] Create claim tracking system
3. [ ] Implement analytics dashboard
4. [ ] Add real-time analytics updates
5. [ ] Create admin notification system

### Phase 5: UI/UX Refinement
1. [X] Add form validation and error handling *(Partially done with coordinates; Login error resolved)*
2. [ ] Implement autosave functionality *(Currently uses localStorage, needs Firebase implementation)*
3. [ ] Add preview mode for item display
4. [X] Create success/error notifications *(Partially done for submission)*
5. [X] Add loading states and animations *(Partially done for map, needs addition for item list/form)*
6. [X] Fix React warnings about setState calls on unmounted components

## Icon Implementation Plan

**Goal:** Define a strategy for managing and displaying icons, prioritizing custom vendor logos (**`presentation.logoUrl`**), falling back to selected React Icons (**`presentation.icon`**), and finally using **category-level icons** if neither is specified.

**Note:** This section outlines the *plan*. Asset creation and code changes will follow.

**1. Category Icons (Fallback System):**
   - **Purpose:** Provide consistent visual identifiers for the main item categories (e.g., Food & Drink, Land Activities) *only* if no custom logo or specific React Icon is set for the item.
   - **Format:** SVG (Scalable Vector Graphics).
   - **Size:** Optimized for UI display (e.g., 24x24 or 32x32 pixels).
   - **Storage:** Store directly within the project's codebase in a dedicated directory (e.g., `src/assets/icons/categories/`).
   - **Naming:** Use clear, descriptive names based on the category (e.g., `category-food-drink.svg`, `category-land-activities.svg`). See list below.
   - **Integration:**
     - Requires a mapping structure (likely in `src/utils/constants.js` or a dedicated file) to associate each detailed tag with its parent category (e.g., `'hiking'` maps to `'Land Activities'`).
     - Requires another structure to map category names to their respective icon file paths (e.g., `'Land Activities'` maps to `'src/assets/icons/categories/category-land-activities.svg'`).
     - Components (like map markers, item lists) will use these mappings to determine the appropriate category icon based on an item's tags *if both `presentation.logoUrl` and `presentation.icon` are missing*.
   - **Management:** Managed as part of the codebase; adding/changing category icons requires a code update and asset management.

**2. Vendor/Custom Icons (Primary Display):**
   - **Purpose:** Allow unique branding for specific vendors or custom visuals for points of interest, displayed preferentially on item details and map markers.
   - **Format:** Allow SVG or PNG (with transparency). Consider enforcing size limits or aspect ratios on upload if necessary.
   - **Storage:** Uploaded images will be stored in **Firebase Storage**.
   - **Integration:**
     - **Upload:** The item/vendor form needs an image upload component specifically for this custom icon/logo. This is *separate* from the React Icon picker.
     - **Saving:** On successful upload to Firebase Storage, the public **download URL** will be saved in the item's Firestore document in the `presentation.logoUrl` field.
     - **Management:** Managed dynamically through the application's form.
     - **Dependencies:** Requires the image upload functionality (`ImageUploader`, `storageService`, Storage/CORS config) to be working.

**3. React Icons (Secondary Display):**
    - **Purpose:** Allow admins to select a specific icon from the `react-icons` library for an item when a custom logo isn't available or desired, overriding the category fallback.
    - **Format:** String representing the icon name (e.g., 'FaBeer').
    - **Storage:** Stored in the `presentation.icon` field in the item's Firestore document.
    - **Integration:**
        - **Selection:** Use the `IconPickerModal` component in the `ItemForm`.
        - **Saving:** The selected icon name string is saved to `presentation.icon`.
    - **Management:** Managed via the `ItemForm`.

**Display Logic (Priority Order):**
   1. If `presentation.logoUrl` exists, display the custom logo image (`<img src={logoUrl} />`).
   2. Else if `presentation.icon` exists, display the specified React Icon component.
   3. Else (neither logo nor specific icon exists), determine the item's primary category based on its `tags` array and the tag-to-category mapping.
   4. Display the corresponding category icon (using the category-to-icon mapping).
   5. If no tags exist or the category cannot be determined, display a generic default category icon (`category-default.svg`).


**Tasks Derived from this Plan:**
   - [X] Define the mapping from detailed tags to main categories (e.g., `tagCategoryMap`). *(Assuming done based on category icon fallback logic)*
   - [X] Define the mapping from main category names to their icon file paths (e.g., `categoryIcons`). *(Assuming done based on category icon fallback logic)*
   - [ ] Source or create initial SVG icons for the 8 main categories plus a default icon. *(Still pending)*
   - [X] Create the `src/assets/icons/categories/` directory and add the category SVG files. *(Assuming done)*
   - [X] **Update relevant UI components** (Map Markers, Item List, Item Detail Modal) to implement the **full display logic** (Custom Logo -> React Icon -> Category Icon -> Default Icon). *(Done)*
   - [X] **Add a file input field** to the `ItemForm` specifically for vendor logo/custom icon upload (using `ImageUploader`). *(Done)*
   - [X] **Add the `presentation.logoUrl` field** to the Firestore `Items` collection schema. *(Done via this edit)*
   - [X] **Implement the upload logic** in `ItemForm` to use `storageService` for the logo and save the URL to `presentation.logoUrl` upon submission. *(Done)*
   - [X] Implement logic in `ItemForm` to save the React Icon name to `presentation.icon`. *(Verified)*
   - [X] Implement `IconPickerModal` for selecting React Icons in `ItemForm`. *(Verified)*

## Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Items collection rules
    match /Items/{itemId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
      
      // Validation rules
      function isValidItem() {
        let item = request.resource.data;
        return item.type in ['vendor', 'poi'] &&
               item.name.size() > 0 &&
               item.description.brief.size() <= 150 &&
               item.location.coordinates.lat >= 20.5 && 
               item.location.coordinates.lat <= 21.0 &&
               item.location.coordinates.lng >= -156.7 && 
               item.location.coordinates.lng <= -155.9;
      }
    }
    
    // Deals collection rules
    match /Deals/{dealId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
      
      // Validation rules
      function isValidDeal() {
        let deal = request.resource.data;
        return deal.title.size() > 0 &&
               deal.validity.startDate < deal.validity.endDate &&
               deal.limits.maxClaims > 0;
      }
    }
  }
}
```

## Next Steps

**CURRENT FOCUS:** Decide next steps (e.g., Marker Clustering, Dynamic Markers, Autosave, Cloud Functions, Geospatial Queries).

- **CURRENT FOCUS:** Complete the Icon Implementation tasks outlined above:
  - Add Custom Logo upload functionality to `ItemForm`.
  - Update UI components (`MapContainer`, `ItemDetailModal`, `ItemList`) to use the full icon display logic (Logo -> React Icon -> Category -> Default).

1. [X] Set up development environment with Firebase *(Configuration confirmed and documented)*
2. [X] Create basic Item Listing component *(Done)*
3. [X] Implement Firebase `queryItems` function for the listing view *(Enhanced with filtering and sorting)*
4. [X] Implement navigation and data loading for editing items *(Done)*
5. [X] Begin Phase 2 implementation (Edit mode in form) *(Verified)*
6. [X] Add search/filter functionality to the Item List view *(Implemented with client and server-side filtering)*
7. [X] Add rich text editor for detailed description *(Implemented with Draft.js and react-draft-wysiwyg)*
8. [X] Implement Firebase Storage for images *(Created storageService.js and ImageUploader component)*
9. [X] Implement gallery order management *(Added DraggableGallery component with drag and drop functionality using @dnd-kit)*
10. [X] Add parking information section *(Enhanced the existing Location & Parking form section with coordinate picker for parking locations)*
11. [✓] Set up Cloud Functions project *(Created deal analytics, real-time updates, and background processing functions. Deployment pending Firebase Blaze plan upgrade. See markdown/CLOUD_FUNCTIONS_PROGRESS.md for details)*
12. [X] Create deal form component *(Created DealForm.js with validation, vendor selection, date picking, and rich text editing features)*
13. [X] Set up deals collection in Firebase *(Added deal-related functions to firestoreService.js)*
14. [X] Implement deal validation logic *(Added validation in DealForm component for all required fields)*
15. [X] Add deal analytics structure *(Created data structure in Firebase and supporting UI components)*
16. [X] Create deal status tracking *(Implemented isActive field and status display in DealList)*
17. [X] Fix React warnings about setState on unmounted components *(Added isMountedRef pattern to ItemForm and MapPicker components)*
18. [X] Update Firestore service for deals *(Fixed naming inconsistency between `addDeal` and `createDeal` functions)*
19. [X] Fix critical issue with deals not being saved *(Fixed collection references in firestoreService.js to use the Deals collection consistently instead of Items collection)*
20. [✓] **Frontend Map Integration** *(Phase 6 - Partial Completion)*
    - [X] Create map view component that displays items as markers
    - [X] Fix markers not staying locked to GPS coordinates during map panning
    - [X] Remove the accuracy circle around user's location that was affecting zoom out
    - [X] Fix map performance issues causing jankiness when panning
    - [X] Enable regular mousewheel zoom without requiring Ctrl key
    - [X] Allow zooming out further to see more of the map area
    - [X] Implement custom markers based on item type *(Now using React Icons)*
    - [ ] Implement marker clustering for areas with many items
    - [✓] Create modal component for displaying item details when marker is clicked *(ItemDetailModal created)*
    - [✓] Display item details in modal (description, images, location info) *(Basic display implemented)*
    - [X] Show associated deals in modal for vendor type items *(Deals, including dates and claims, are now displayed)*
    - [ ] Implement deal claiming functionality for users
21. Implement remaining Phase 4 (Analytics & Cloud Functions) tasks.
22. Address remaining Phase 5 (UI/UX Refinement) tasks (Autosave, Preview Mode).
23. Address remaining Phase 6 (Map Integration) tasks (Clustering, Modal Details - Deals/Claiming).
24. **Refine Designable Modal:**
    - Improve save layout user feedback (Snackbar/Toast).
    - Refine default layout values in `ItemDetailModal.js`.
    - Enhance CSS for a more polished appearance.
    - Add Firestore security rules for `presentation.modalLayout`.
    - Conduct thorough testing across different screen sizes.

## Phase 6: Map Integration
1. [✓] Create MapView component (`MapContainer.js`)
   - [X] Display all items as markers
   - [X] Implement custom markers based on item type *(Using React Icons)*
   - [X] Add tooltip with basic info on hover
   - [X] Fix marker positioning issues during map movement
   - [X] Optimize map performance for smooth panning and zooming
   - [X] Improve map controls and zoom behavior
2. [ ] Create ItemDetailModal component
   - [ ] Display comprehensive item details from ItemForm data
   - [ ] Show image gallery with carousel
   - [ ] Implement responsive design for mobile/desktop
3. [ ] Add DealSection to modal for vendor items
   - [ ] List all active deals
   - [ ] Show deal details on click/expand
   - [ ] Implement claim button and tracking
4. [ ] Create animations and transitions
   - [ ] Smooth open/close animations for modal
   - [ ] Loading states for data fetching

## Data Persistence Testing Plan (Manual)

1.  **Submit Test Data:**
    *   Log in as an authenticated admin user.
    *   Fill out and submit the `ItemForm` with diverse data.
2.  **Verify in Firestore Console:**
    *   Inspect the created document in the `Items` collection.
    *   Compare structure, fields, and data types against the defined model.
    *   Check specific transformations: coordinate numbers, tags array (strings), timestamps, nested objects.
3.  **Basic Security Check:**
    *   Confirm the write operation succeeds based on current authentication/admin rules.
4.  **Efficiency Note:**
    *   Document the need for Firestore index configuration and testing once querying is implemented.

## Map Search Implementation (Ongoing)

**Goal:** Implement a search bar on the map view (`MapContainer.js`) allowing users to find items (vendors, POIs) by name.

**Components:**
*   `src/components/map/MapSearchBar.js`: The main search component using MUI `TextField` and `Popper`.
*   `src/components/map/MapSearchBar.css`: Styles for positioning and appearance.
*   `src/components/MapContainer.js`: Integrates and renders the `MapSearchBar`.
*   `src/services/firestoreService.js`: Contains the `searchItems` function for querying Firestore.

**Current Functionality (Basic):**
*   Search bar is displayed over the map.
*   Input is debounced (300ms delay).
*   Triggers `firestoreService.searchItems` when input length > 2.
*   `searchItems` performs a case-sensitive prefix search on the `name` field in the `Items` collection.
*   Search results (or loading/error/no results state) are displayed in a Popper dropdown below the search bar.
*   Selecting a result triggers `map.flyTo` to navigate the map to the item's location.

**Design Decisions:**
*   The search results popover is intended for quick lookup and navigation. It will remain distinct from any potential future "user modal" that might display more comprehensive user-specific data like full lists of favorites or claimed deals.

**Next Steps / TODOs:**
*   [ ] Refine UI/UX of the search results list (e.g., add item icons/logos, improve layout).
*   [ ] Implement location actions in the popover (e.g., buttons/icons to copy coordinates, generate links for Google/Apple Maps).
*   [ ] Address case-insensitivity for search (likely requires adding/querying a lowercase `name` field in Firestore).
*   [ ] Consider searching additional fields (e.g., `tags`, `description.brief`).
*   [ ] Implement basic display of Favorites/Claimed Deals within the search popover (requires implementing those features first).
*   [ ] Add Firestore index for `Items` collection on `name` field (Ascending) if prompted by Firestore errors.

## Firebase Security Rules

# ... (Existing rules) ...

## Next Steps

**CURRENT FOCUS:** Continue development of the Map Search feature (UI refinement, location actions, case-insensitive search).

# ... (Rest of the file) ...
