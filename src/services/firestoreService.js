import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, // Add other query constraints as needed (orderBy, limit, etc.)
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
 * Retrieves item documents from Firestore, optionally applying filters.
 * @param {object} [filters] - Optional filters (e.g., { type: 'vendor' }).
 * @returns {Promise<object[]>} An array of item objects.
 */
export const queryItems = async (filters = {}) => {
  try {
    // Basic query, can be expanded with filters
    let q = query(itemsCollectionRef); 

    // Example filter (can add more complex logic based on 'filters' object)
    if (filters.type) {
      q = query(itemsCollectionRef, where('type', '==', filters.type));
    }
    // Add other filters like name search, tag search, etc. here

    const querySnapshot = await getDocs(q);
    const items = [];
    querySnapshot.forEach((doc) => {
      // Combine doc id with data
      items.push({ id: doc.id, ...doc.data() });
    });
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