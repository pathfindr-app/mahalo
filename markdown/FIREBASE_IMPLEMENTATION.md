# Firebase Implementation Plan

## Current Status
- Basic Firebase configuration complete (`src/services/firebase.js`) - *Verified and corrected 2024-04-16*
- Core services initialized (Auth, Firestore, Storage, Analytics)
- Authentication implemented with Google Sign-in - *Configuration corrected and tested 2024-04-16*
- Protected routes implemented
- Data models defined in `CURRENT_TICKET.md`
- Security rules outlined but not implemented - *Need to implement for non-test users*
- Added `markdown/CONFIG_DETAILS.md` for core configurations.

## Implementation Phases

### Phase 1: Authentication Context ✅ - *Largely complete and verified*
```javascript
// src/context/AuthContext.js structure - COMPLETED
{
  user: null | {
    uid: string,
    email: string,
    displayName: string,
    photoURL: string
  },
  loading: boolean,
  error: string | null,
  loginWithGoogle: () => Promise,
  logout: () => Promise,
  resetPassword: (email) => Promise,
  updateProfile: (data) => Promise
}
```

#### Completed Tasks
1. ✅ Created `AuthContext.js` and `AuthProvider` component
2. ✅ Implemented authentication state observer
3. ✅ Created authentication methods:
   - Google Sign-in integration
   - Password reset functionality
   - Profile updates
4. ✅ Added loading and error states
5. ✅ Created protected route components
6. ✅ Implemented route protection for admin pages
7. ✅ Resolved Google Sign-in configuration issues (OAuth Consent Screen, Client ID, Redirect URIs in Google Cloud, `firebase.js` config)

#### Next Steps
1. Add user role management
2. Implement admin verification
3. Add user profile management UI
4. Add logout functionality in UI

### Phase 2: Firestore Service Layer - *Partially started*
```javascript
// src/services/firestoreService.js structure
{
  // Item Operations
  createItem: (data) => Promise<ItemId>,
  updateItem: (id, data) => Promise<void>,
  deleteItem: (id) => Promise<void>,
  getItem: (id) => Promise<ItemData>,
  queryItems: (filters) => Promise<ItemData[]>,
  
  // Deal Operations
  createDeal: (data) => Promise<DealId>,
  updateDeal: (id, data) => Promise<void>,
  deleteDeal: (id) => Promise<void>,
  getDeal: (id) => Promise<DealData>,
  queryDeals: (filters) => Promise<DealData[]>,
  
  // Batch Operations
  batchUpdate: (operations) => Promise<void>,
  
  // Real-time Subscriptions
  subscribeToItem: (id, callback) => unsubscribe,
  subscribeToDeals: (itemId, callback) => unsubscribe
}
```

#### Tasks
1. Create base CRUD operations for Items - *(Basic `createItem` working via ItemForm submission)*
   - [ ] Implement `queryItems` with filtering/sorting options
   - [ ] Implement `getItem`
   - [ ] Implement `updateItem`
   - [ ] Implement `deleteItem`
2. Create base CRUD operations for Deals
3. Implement query builders with proper indexing
4. Add batch operation support
5. Create real-time subscription methods
6. Add proper error handling and validation
7. Implement optimistic updates where appropriate

### Phase 3: Storage Service Layer
```javascript
// src/services/storageService.js structure
{
  uploadImage: (file, path) => Promise<url>,
  deleteImage: (url) => Promise<void>,
  getDownloadUrl: (path) => Promise<url>,
  listImages: (prefix) => Promise<string[]>,
  optimizeImage: (file) => Promise<blob>
}
```

#### Tasks
1. Create image upload functionality
2. Implement image optimization
3. Add proper file type validation
4. Create deletion cleanup
5. Implement URL caching
6. Add upload progress tracking
7. Create batch upload capabilities

### Phase 4: Security Rules Implementation
```javascript
// firestore.rules structure
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Function definitions
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }
    
    function isValidItem() {
      let item = request.resource.data;
      return item.type in ['vendor', 'poi'] &&
             item.name.size() > 0 &&
             item.description.brief.size() <= 150;
    }
    
    // Collection rules
    match /Items/{itemId} {
      allow read: if true;
      allow write: if isAdmin() && isValidItem();
    }
    
    match /Deals/{dealId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

#### Tasks
1. Implement and deploy base security rules - *(Currently allows writes only for authenticated admin, needs refinement and testing, especially for test user mode)*
2. Create validation functions
3. Add rate limiting rules
4. Implement data validation rules
5. Add proper error messages
6. Test rules with security rules simulator
7. Document all security rules

### Phase 5: Analytics Integration
```javascript
// src/services/analyticsService.js structure
{
  logEvent: (eventName, params) => void,
  setUserProperties: (properties) => void,
  startTrace: (traceName) => Trace,
  logError: (error) => void
}
```

#### Tasks
1. Set up custom events tracking
2. Implement user properties
3. Add performance monitoring
4. Create error logging
5. Set up conversion tracking
6. Implement dashboard views
7. Create automated reports

## Testing Plan

### Unit Tests
1. Authentication methods
2. CRUD operations
3. Security rules
4. File upload/download
5. Analytics events

### Integration Tests
1. Complete user flows
2. Admin operations
3. Real-time updates
4. Batch operations
5. Error scenarios

### Performance Tests
1. Query response times
2. Image upload/download speeds
3. Real-time update latency
4. Batch operation timing
5. Cache effectiveness

## Deployment Checklist

### Pre-deployment
- [ ] All security rules tested
- [ ] Indexes created and deployed
- [ ] Storage rules configured
- [ ] Analytics events registered
- [ ] Error tracking configured

### Post-deployment
- [ ] Verify authentication flows
- [ ] Test CRUD operations
- [ ] Validate real-time updates
- [ ] Check analytics reporting
- [ ] Monitor error logs

## Dependencies
```json
{
  "firebase": "^10.x.x",
  "react-firebase-hooks": "^5.x.x",
  "@firebase/rules-unit-testing": "^3.x.x"
}
```

## Next Steps
1. ~~Begin with Phase 1: Authentication Context~~ *(Completed)*
2. Set up testing environment
3. Create base service functions - *(Continue building out Firestore service layer: `queryItems`, `getItem`, `updateItem`)*
4. Deploy initial security rules - *(Implement and test more robust rules)*
5. Begin admin dashboard implementation - *(Focus on Item Listing and linking to Item Form for editing - Phase 1/2)*

## Notes
- All Firebase operations should be properly typed
- Error handling should be consistent across services
- Real-time updates should be optimized for performance
- Security rules should be thoroughly tested
- Analytics should be GDPR compliant 