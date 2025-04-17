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

const itemsCollectionRef = collection(db, 'Items');

/**
 * Creates a new item document in Firestore.
 * @param {object} itemData - The data for the new item.
 * @returns {Promise<string>} The ID of the newly created document.
 */
export const createItem = async (itemData) => {
  try {
    const docRef = await addDoc(itemsCollectionRef, {
      ...itemData,
      status: {
        ...itemData.status,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      },
    });
    console.log('Document written with ID: ', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error('Error adding document: ', e);
    throw new Error('Failed to create item');
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
 * Updates an existing item document in Firestore.
 * @param {string} id - The ID of the item document to update.
 * @param {object} updatedData - An object containing the fields to update.
 * @returns {Promise<void>}
 */
export const updateItem = async (id, updatedData) => {
  try {
    const itemDoc = doc(db, 'Items', id);
    await updateDoc(itemDoc, {
      ...updatedData,
      'status.lastUpdated': serverTimestamp(), // Ensure lastUpdated is updated
    });
    console.log('Document updated with ID: ', id);
  } catch (e) {
    console.error('Error updating document: ', e);
    throw new Error('Failed to update item');
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

// Export all functions
export default {
  createItem,
  getItem,
  queryItems,
  updateItem,
  deleteItem,
}; 