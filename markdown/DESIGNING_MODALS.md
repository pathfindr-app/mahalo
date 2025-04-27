# Item Detail Modal Implementation Plan

## Overview

This plan outlines the steps to create a well-structured, fixed layout for the Item Detail Modal displayed on the map view. It provides a consistent presentation for item details like descriptions, images, deals, etc.

## Core UI Library

- [X] **Material UI (MUI):** Used for modal components, layout (Grid), typography, and other UI elements.

## Firestore Schema

- [X] **Target Collection:** `Items`
- [X] **Relevant Fields:** The modal fetches data from existing fields within the `Items` documents (e.g., `name`, `description.brief`, `description.detailed`, `presentation.headerImage`, `presentation.gallery`, `location`, `tags`, `type`).
- [ ] **(Removed):** The `presentation.modalLayout` field is no longer used as the layout is now fixed within the component.

## Component Implementation (`ItemDetailModal.js`)

This component displays the item details when a map marker is clicked. It now uses a fixed layout managed by MUI Grid.

**1. State Management:**
   - [X] `itemData`: The data for the specific item being displayed.
   - [X] `dealsData`: Data for deals associated with the item (if applicable).
   - [X] `isLoading`: Boolean state for handling data fetching.
   - [X] `error`: State for handling potential errors.
   - [ ] **(Removed):** `layout` and `isDesignMode` states are no longer needed.

**2. Fetching Data:**
   - [X] On mount or when `itemId` prop changes, fetch the `itemData` from Firestore using `getItem(itemId)`.
   - [X] If `itemData.type` is 'vendor', fetch associated `dealsData` using `queryDeals`.

**3. Defining Content Blocks:**
   - [X] Core content sections (Name/Title, Brief Description, Detailed Description, Header Image, Gallery, Location Info, Parking Info, Deals Section, Tags, Best Time, Weather Notes) are identified.
   - [X] Separate functional components (e.g., `DescriptionBlock`, `GalleryBlock`, `LocationBlock`, `DealsBlock`, etc.) are defined within `ItemDetailModal.js` for clarity and reusability.
   - [X] The `DealsBlock` now correctly displays deal validity dates (using `validity.startDate`, `validity.endDate` and a `formatDate` helper that handles Firestore Timestamps) and claim counts (using `analytics.currentlyClaimed` and `limits.maxClaims`).
   - [X] Conditional rendering logic ensures only blocks with available data are displayed.

**4. Fixed Layout with MUI Grid:**
   - [X] Removed `react-grid-layout` integration.
   - [X] The main content area uses MUI's `<Grid container spacing={2}>` component.
   - [X] Content blocks are placed within `<Grid item xs={...} md={...}>` components to create a responsive layout.
     - Example: Description and Gallery might appear side-by-side on medium screens (`md`) but stack vertically on extra-small screens (`xs`).
   - [X] The layout adjusts based on which content blocks have data (e.g., if there's no gallery, the description takes up full width).

   ```jsx
   // Simplified Structure Example within ItemDetailModal return:
   <Modal>
     <Box sx={modalStyle}>
       {/* Header Section (Title, Brief, Header Image, Close Button) */}
       <Box className="item-detail-header"> ... </Box>

       {/* Scrollable Content Area */}
       <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, backgroundColor: '#f4f4f4' }}>
         {loading && <CircularProgress />}
         {error && <Typography color="error">{error}</Typography>}
         {item && (
           <Grid container spacing={2}>
             {/* Description */} 
             {showDescription && (
               <Grid item xs={12} md={showGallery ? 7 : 12}>
                 <DescriptionBlock item={item} />
               </Grid>
             )}
             {/* Gallery */}
             {showGallery && (
               <Grid item xs={12} md={showDescription ? 5 : 12}>
                 <GalleryBlock item={item} />
               </Grid>
             )}
             {/* Location */}
             {showLocation && (
               <Grid item xs={12} sm={6} md={4}>
                 <LocationBlock item={item} getDirectionsUrl={...} />
               </Grid>
             )}
             {/* Parking */}
             {showParking && (
               <Grid item xs={12} sm={6} md={4}>
                 <ParkingBlock item={item} getDirectionsUrl={...} />
               </Grid>
             )}
             {/* Deals */}
             {showDeals && (
                <Grid item xs={12} sm={6} md={4}>
                  <DealsBlock deals={deals} />
                </Grid>
             )}
             {/* Tags, BestTime, WeatherNotes etc. in appropriate Grid items... */}
           </Grid>
         )}
       </Box>
     </Box>
   </Modal>
   ```

**5. Admin Controls:**
   - [ ] **(Removed):** Controls for designing and saving layouts are removed. The `isAdmin` prop is no longer needed for layout purposes in this component.

**6. Styling:**
   - [X] Uses `ItemDetailModal.css` for specific component styling (header, gallery grid, content blocks).
   - [X] Leverages MUI's styling capabilities (sx prop, theme) for layout and base component styles.
   - [X] Removed CSS specific to `react-grid-layout`.
   - [X] Renamed general block styles (e.g., `.content-block`, `.content-block-inner`).

## Implementation Steps (Revised)

1.  [X] **Install/Verify Dependencies:** Ensure `@mui/material` and `@mui/icons-material` are installed.
2.  [ ] **(Removed):** Update Firestore Rules (No longer necessary for layout field).
3.  [X] **Refactor `ItemDetailModal.js`:**
    - [X] Remove `react-grid-layout` and associated state/logic.
    - [X] Implement data fetching logic for item and deals.
    - [X] Define content block sub-components.
    - [X] Implement the fixed layout using MUI Grid.
    - [X] Add conditional rendering for blocks based on data availability.
    - [X] Remove admin layout controls.
4.  [X] **Update `ItemDetailModal.css`:**
    - [X] Remove `react-grid-layout` specific styles.
    - [X] Adapt styles for the new fixed layout and rename classes.
5.  [X] **Map Integration:**
    - [X] Ensure the map component (`MapContainer.js`) opens `ItemDetailModal`, passing `itemId`.
    - [X] Remove passing of `isAdmin` prop if solely used for layout design.
6.  [X] **Styling:** Refine CSS in `ItemDetailModal.css` and use MUI sx props for a polished look.
7.  [✓] **Testing:**
    - [X] Test loading items with various data combinations (with/without gallery, deals, parking etc.).
    - [X] Verify the layout adapts correctly based on available content.
    - [X] Test responsiveness across different screen sizes (using browser developer tools).
    - [X] Ensure scrollbars work correctly within content blocks and the main modal area.

## Considerations

- **Performance:** Data fetching is streamlined. MUI Grid performance is generally good.
- **Responsiveness:** The MUI Grid system provides a solid foundation for responsiveness. Testing across devices is key.
- **Content Overflow:** Ensure content within blocks handles overflow gracefully (e.g., using `overflow-y: auto` on `.content-block-inner`).
- **Aesthetics:** Focus on clean spacing, typography, and visual hierarchy within the fixed layout.
- **Error Handling:** Robust error handling for Firestore operations is maintained.

## Next Steps / Ongoing Refinement

- [ ] Refine CSS in `ItemDetailModal.css` for improved aesthetics (spacing, borders, backgrounds, scrollbars within blocks).
- [ ] Conduct thorough testing across different devices/screen sizes and with various item data configurations.
- [ ] Consider adding loading skeletons for a smoother perceived loading experience.
- [ ] Improve user feedback for data loading errors (e.g., using Snackbar/Toast). 