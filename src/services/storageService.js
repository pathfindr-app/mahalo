import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll 
} from 'firebase/storage';
import { storage } from './firebase.js';

/**
 * Upload an image file to Firebase Storage
 * @param {File} file - The file object to upload
 * @param {string} path - The path within storage where the file should be saved
 * @param {Function} [progressCallback] - Optional callback for upload progress updates
 * @returns {Promise<string>} - A promise that resolves to the download URL
 */
export const uploadImage = async (file, path, progressCallback = null) => {
  try {
    // Create a reference to the file location
    const storageRef = ref(storage, path);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Uploaded file to:', snapshot.metadata.fullPath);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};

/**
 * Delete an image from Firebase Storage
 * @param {string} path - The path of the file to delete
 * @returns {Promise<void>}
 */
export const deleteImage = async (path) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    console.log('File deleted successfully:', path);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
};

/**
 * Get the download URL for a file in Firebase Storage
 * @param {string} path - The path of the file
 * @returns {Promise<string>} - A promise that resolves to the download URL
 */
export const getImageUrl = async (path) => {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error getting image URL:', error);
    throw new Error('Failed to get image URL');
  }
};

/**
 * List all images in a directory
 * @param {string} path - The directory path
 * @returns {Promise<Object[]>} - A promise that resolves to an array of objects with name and url
 */
export const listImages = async (path) => {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    
    // Get download URLs for all items
    const items = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          url,
          fullPath: itemRef.fullPath
        };
      })
    );
    
    return items;
  } catch (error) {
    console.error('Error listing images:', error);
    throw new Error('Failed to list images');
  }
};

/**
 * Generate a unique filename for an image
 * @param {string} originalName - The original filename
 * @returns {string} - A unique filename
 */
export const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
};

/**
 * Helper function to extract just the filename from a full storage path
 * @param {string} fullPath - The full storage path
 * @returns {string} - Just the filename
 */
export const getFilenameFromPath = (fullPath) => {
  if (!fullPath) return null;
  const parts = fullPath.split('/');
  return parts[parts.length - 1];
};

// Export all functions
export default {
  uploadImage,
  deleteImage,
  getImageUrl,
  listImages,
  generateUniqueFilename,
  getFilenameFromPath
}; 