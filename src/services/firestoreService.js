import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit,
  startAfter,
  endAt,
  startAt,
  arrayContains,
  or,
  and,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase.js'; // ADDED .js extension
import { generateImageId, createImageObject } from './storageService';
import { getAuth } from 'firebase/auth'; // <<< Import getAuth

const itemsCollectionRef = collection(db, 'Items');
const dealsCollectionRef = collection(db, 'Deals');

/**
 * Process item data for storage in Firestore, handling base64 images
 * @param {object} itemData - The item data to process
 * @returns {object} - Processed item data ready for storage
 */
export const processItemDataForStorage = (itemData) => {
  const processedData = { ...itemData };
  
  // Process main image if it exists
  if (processedData.imageUrl && processedData.imageUrl.startsWith('data:image')) {
    console.log('Processing base64 image for item');
    const imageId = processedData.imageId || generateImageId();
    processedData.imageId = imageId;
    processedData.image = createImageObject(processedData.imageUrl, imageId, true);
  }
  
  // Update timestamp
  processedData.updatedAt = new Date().toISOString();
  
  return processedData;
};

/**
 * Process deal data for storage in Firestore, handling base64 images
 * @param {object} dealData - The deal data to process
 * @returns {object} - Processed deal data ready for storage
 */
export const processDealDataForStorage = (dealData) => {
  const processedData = { ...dealData };
  
  // Process main image if it exists
  if (processedData.imageUrl && processedData.imageUrl.startsWith('data:image')) {
    console.log('Processing base64 image for deal');
    const imageId = processedData.imageId || generateImageId();
    processedData.imageId = imageId;
    processedData.image = createImageObject(processedData.imageUrl, imageId, true);
  }
  
  // Update timestamp
  processedData.updatedAt = new Date().toISOString();
  
  return processedData;
};

/**
 * Create a new item in the Firestore database.
 * @param {object} itemData - Data for the new item.
 * @returns {Promise<string>} A promise that resolves with the ID of the created item.
 */
export const createItem = async (itemData) => {
  try {
    const processedData = processItemDataForStorage(itemData);
    const itemRef = collection(db, 'Items');
    const docRef = await addDoc(itemRef, {
      ...processedData,
      createdAt: new Date().toISOString(),
      active: true
    });
    console.log('Item created with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating item: ', error);
    throw error;
  }
};

/**
 * Retrieves a single item document from Firestore by its ID.
 * @param {string} id - The ID of the item document to retrieve.
 * @returns {Promise<object|null>} The item data or null if not found.
 */
export const getItem = async (id) => {
  try {
    const docRef = doc(db, 'Items', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Combine doc id with data
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (e) {
    console.error('Error getting document:', e);
    throw new Error('Failed to retrieve item');
  }
};

/**
 * Retrieves item documents from Firestore, applying various filters and sorting.
 * @param {object} [options] - Query options
 * @param {string} [options.type] - Filter by item type (e.g., 'vendor', 'poi')
 * @param {string} [options.nameStartsWith] - Filter items where name starts with provided string
 * @param {string} [options.nameContains] - Filter items where name contains provided string (less efficient, client-side filtering)
 * @param {string[]} [options.tags] - Filter items that have at least one of these tags
 * @param {boolean} [options.activeOnly] - Filter only active items if true
 * @param {string} [options.sortBy] - Field to sort by (name, type, createdAt, lastUpdated)
 * @param {boolean} [options.sortDesc] - Sort in descending order if true
 * @param {number} [options.limitTo] - Limit number of results
 * @param {object} [options.startAfterDoc] - Document to start after (for pagination)
 * @returns {Promise<object[]>} An array of item objects.
 */
export const queryItems = async (options = {}) => {
  try {
    let queryConstraints = [];
    
    // Type filter
    if (options.type) {
      queryConstraints.push(where('type', '==', options.type));
    }
    
    // Tags filter (array-contains-any for OR condition on tags)
    if (options.tags && options.tags.length > 0) {
      // Firebase has a limit of 10 values in an array-contains-any query
      if (options.tags.length <= 10) {
        queryConstraints.push(where('tags', 'array-contains-any', options.tags));
      } else {
        console.warn('Too many tags for Firestore query. Limiting to first 10.');
        queryConstraints.push(where('tags', 'array-contains-any', options.tags.slice(0, 10)));
      }
    }
    
    // Active items only
    if (options.activeOnly) {
      queryConstraints.push(where('status.isActive', '==', true));
    }
    
    // Name starts with filter (uses indexing efficiently)
    if (options.nameStartsWith) {
      const searchText = options.nameStartsWith.toLowerCase();
      queryConstraints.push(where('name', '>=', searchText));
      queryConstraints.push(where('name', '<=', searchText + '\uf8ff'));
    }
    
    // Sort options
    if (options.sortBy) {
      const sortDirection = options.sortDesc ? 'desc' : 'asc';
      const sortPath = options.sortBy.includes('.') 
        ? options.sortBy // For paths like 'status.lastUpdated'
        : options.sortBy; // For direct fields like 'name'
      
      queryConstraints.push(orderBy(sortPath, sortDirection));
    } else {
      // Default sort by name
      queryConstraints.push(orderBy('name', 'asc'));
    }
    
    // Limit results
    if (options.limitTo && typeof options.limitTo === 'number') {
      queryConstraints.push(limit(options.limitTo));
    }
    
    // Pagination
    if (options.startAfterDoc) {
      queryConstraints.push(startAfter(options.startAfterDoc));
    }
    
    // Execute query
    const q = query(itemsCollectionRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    const items = [];
    querySnapshot.forEach((doc) => {
      // Combine doc id with data
      const data = doc.data();
      items.push({ id: doc.id, ...data });
    });
    
    // Handle name contains filter (has to be done client-side)
    if (options.nameContains && typeof options.nameContains === 'string') {
      const searchText = options.nameContains.toLowerCase();
      return items.filter(item => 
        item.name.toLowerCase().includes(searchText) || 
        (item.description?.brief || '').toLowerCase().includes(searchText)
      );
    }
    
    return items;
  } catch (e) {
    console.error('Error querying documents: ', e);
    throw new Error('Failed to query items');
  }
};

/**
 * Update an existing item in the Firestore database.
 * @param {string} itemId - The ID of the item to update.
 * @param {object} updatedData - The updated data for the item.
 * @returns {Promise<void>} A promise that resolves when the item is updated.
 */
export const updateItem = async (itemId, updatedData) => {
  try {
    const processedData = processItemDataForStorage(updatedData);
    const itemRef = doc(db, 'Items', itemId);
    await updateDoc(itemRef, processedData);
    console.log('Item updated: ', itemId);
  } catch (error) {
    console.error('Error updating item: ', error);
    throw error;
  }
};

/**
 * Deletes an item document from Firestore.
 * @param {string} id - The ID of the item document to delete.
 * @returns {Promise<void>}
 */
export const deleteItem = async (id) => {
  try {
    const itemDoc = doc(db, 'Items', id);
    await deleteDoc(itemDoc);
    console.log('Document deleted with ID: ', id);
  } catch (e) {
    console.error('Error deleting document: ', e);
    throw new Error('Failed to delete item');
  }
};

// Add functions for Deals (createDeal, getDeal, queryDeals, updateDeal, deleteDeal) later

// Add functions for batch operations if needed
// Add functions for real-time subscriptions if needed

// Deal-related Firebase functions

/**
 * Add a new deal to the Firestore database.
 * @param {object} dealData - Data for the new deal.
 * @returns {Promise<string>} A promise that resolves with the ID of the created deal.
 */
export const addDeal = async (dealData) => {
  try {
    const processedData = processDealDataForStorage(dealData);
    const dealRef = collection(db, 'deals');
    const docRef = await addDoc(dealRef, {
      ...processedData,
      createdAt: new Date().toISOString(),
      active: true
    });
    console.log('Deal created with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating deal: ', error);
    throw error;
  }
};

/**
 * Retrieves a single deal document from Firestore by its ID.
 * @param {string} id - The ID of the deal document to retrieve.
 * @returns {Promise<object|null>} The deal data or null if not found.
 */
export const getDeal = async (id) => {
  try {
    const docRef = doc(db, "Deals", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        success: true,
        data: { id: docSnap.id, ...docSnap.data() }
      };
    } else {
      return {
        success: false,
        error: "Deal not found"
      };
    }
  } catch (e) {
    console.error("Error getting deal: ", e);
    throw new Error("Failed to get deal");
  }
};

/**
 * Retrieves deal documents from Firestore, applying various filters and sorting.
 * @param {object} [options] - Query options
 * @param {string} [options.itemId] - Filter by associated item ID
 * @param {boolean} [options.activeOnly] - Filter only active deals if true
 * @param {boolean} [options.currentOnly] - Filter deals that are currently valid (not expired)
 * @param {string} [options.sortBy] - Field to sort by (title, startDate, endDate, etc.)
 * @param {boolean} [options.sortDesc] - Sort in descending order if true
 * @param {number} [options.limitTo] - Limit number of results
 * @returns {Promise<object[]>} An array of deal objects.
 */
export const queryDeals = async (options = {}) => {
  try {
    // --- REVERTING TEMPORARY SIMPLIFICATION ---
    // console.log('Attempting simplified queryDeals...');
    // const querySnapshot = await getDocs(dealsCollectionRef); // Get all docs without constraints
    let queryConstraints = [];
    
    // Item ID filter
    if (options.itemId) {
      queryConstraints.push(where('itemId', '==', options.itemId));
    }
    
    // Active deals only
    if (options.activeOnly) {
      queryConstraints.push(where('status.isActive', '==', true));
    }
    
    // Current deals only (not expired)
    if (options.currentOnly) {
      const now = new Date();
      queryConstraints.push(where('validity.endDate', '>=', now));
    }
    
    // Sort options
    if (options.sortBy) {
      const sortDirection = options.sortDesc ? 'desc' : 'asc';
      queryConstraints.push(orderBy(options.sortBy, sortDirection));
    } else {
      // Default sort by title
      queryConstraints.push(orderBy('title', 'asc'));
    }
    
    // Limit results
    if (options.limitTo && typeof options.limitTo === 'number') {
      queryConstraints.push(limit(options.limitTo));
    }
    
    // Execute query
    const q = query(dealsCollectionRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    // --- END OF REVERTED SIMPLIFICATION ---
    
    const deals = [];
    querySnapshot.forEach((doc) => {
      // Combine doc id with data
      deals.push({ id: doc.id, ...doc.data() });
    });
    
    // console.log(`Simplified queryDeals fetched ${deals.length} documents.`); // Remove log
    return deals;
  } catch (e) {
    console.error('Error querying deal documents: ', e);
    throw new Error('Failed to query deals');
  }
};

/**
 * Update an existing deal in the Firestore database.
 * @param {string} dealId - The ID of the deal to update.
 * @param {object} dealData - The updated data for the deal.
 * @returns {Promise<void>} A promise that resolves when the deal is updated.
 */
export const updateDeal = async (dealId, dealData) => {
  try {
    // <<< Add claims logging >>>
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const idTokenResult = await user.getIdTokenResult(true); // Force refresh token
      console.log('User Claims before updating deal:', idTokenResult.claims);
    } else {
      console.log('No user logged in before updating deal.');
    }
    // <<< End claims logging >>>

    const processedData = processDealDataForStorage(dealData);
    const dealRef = doc(db, 'Deals', dealId); // <<< CORRECTED collection name to 'Deals' >>>
    await updateDoc(dealRef, processedData);
    console.log('Deal updated: ', dealId);
  } catch (error) {
    console.error('Error updating deal: ', error);
    throw error;
  }
};

/**
 * Deletes an existing deal document from Firestore.
 * @param {string} id - The ID of the deal document to delete.
 * @returns {Promise<void>}
 */
export const deleteDeal = async (id) => {
  try {
    const dealRef = doc(db, "Deals", id);
    await deleteDoc(dealRef);
    
    return {
      success: true
    };
  } catch (e) {
    console.error("Error deleting deal: ", e);
    throw new Error("Failed to delete deal");
  }
};

export const getDeals = async () => {
  try {
    const q = query(
      dealsCollectionRef,
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const deals = [];
    
    querySnapshot.forEach((doc) => {
      deals.push({ id: doc.id, ...doc.data() });
    });
    
    return {
      success: true,
      data: deals
    };
  } catch (e) {
    console.error("Error querying deal documents: ", e);
    return {
      success: false,
      error: e.message
    };
  }
};

/**
 * Searches items by name prefix (case-sensitive).
 * TODO: Implement case-insensitive search, potentially by querying a 'name_lowercase' field.
 * TODO: Consider searching other fields like tags or brief description.
 * TODO: Implement pagination if results can be large.
 * @param {string} searchText The text to search for.
 * @param {number} resultLimit Max number of results to return.
 * @returns {Promise<Array<Object>>} A promise resolving to an array of matching item objects.
 */
export const searchItems = async (searchText, resultLimit = 10) => {
  if (!searchText) {
    return [];
  }

  console.log(`Firestore: Searching for items starting with "${searchText}"`);

  // Firestore range queries are case-sensitive.
  // A common workaround is to store a lowercase version of the field.
  // For now, performing a case-sensitive prefix search.
  const searchQuery = query(
    itemsCollectionRef,
    where('name', '>=', searchText),
    where('name', '<=', searchText + '\uf8ff'), // \uf8ff is a high Unicode character for prefix matching
    orderBy('name'), // Order by name to make the range query work correctly
    limit(resultLimit)
  );

  try {
    const querySnapshot = await getDocs(searchQuery);
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log(`Firestore: Found ${items.length} items matching "${searchText}"`);
    return items;
  } catch (error) {
    console.error("Error searching items:", error);
    throw error; // Re-throw the error to be caught by the caller
  }
};

// Export all functions
export default {
  createItem,
  getItem,
  queryItems,
  updateItem,
  deleteItem,
  addDeal,
  getDeal,
  queryDeals,
  updateDeal,
  deleteDeal,
  getDeals,
  searchItems,
}; 