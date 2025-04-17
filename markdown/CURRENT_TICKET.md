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
    icon: string,            // Emoji or icon code
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
5. [ ] Implement gallery order management
6. [ ] Add parking information section
7. [X] Create presentation style controls *(Added opacity/blur sliders)*
8. [X] Implement selection system for expanded tags (UI may need update, e.g., searchable dropdown)

### Phase 3: Deal Management
1. [ ] Create deal form component
2. [ ] Set up deals collection in Firebase
3. [ ] Implement deal validation logic
4. [ ] Add deal analytics structure
5. [ ] Create deal status tracking

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

1. [X] Set up development environment with Firebase *(Configuration confirmed and documented)*
2. [X] Create basic Item Listing component *(Done)*
3. [X] Implement Firebase `queryItems` function for the listing view *(Enhanced with filtering and sorting)*
4. [X] Implement navigation and data loading for editing items *(Done)*
5. [X] Begin Phase 2 implementation (Edit mode in form) *(Verified)*
6. [X] Add search/filter functionality to the Item List view *(Implemented with client and server-side filtering)*
7. [X] Add rich text editor for detailed description *(Implemented with Draft.js and react-draft-wysiwyg)*
8. [X] Implement Firebase Storage for images *(Created storageService.js and ImageUploader component)*
9. [ ] Implement gallery order management
10. [ ] Add parking information section
11. [ ] Set up Cloud Functions project

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
