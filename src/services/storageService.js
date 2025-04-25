import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  uploadBytesResumable
} from 'firebase/storage';
import { storage, auth } from './firebase.js';
import { v4 as uuidv4 } from 'uuid';

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
    
    try {
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (urlError) {
      // If there's a CORS error when getting the download URL, use the fallback approach
      if (urlError.code === 'storage/cors-error' || urlError.message.includes('CORS')) {
        console.warn('CORS error detected when getting download URL, using fallback approach');
        // Use the project ID and path to construct a public URL (this is a workaround)
        const projectId = 'mahalorewardscard';
        const encodedPath = encodeURIComponent(snapshot.metadata.fullPath);
        return `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o/${encodedPath}?alt=media`;
      }
      throw urlError;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image: ' + error.message);
  }
};

/**
 * Upload directly to Firebase Storage using fetch to avoid CORS issues with the SDK
 * This is a more direct method that avoids some CORS limitations
 * @param {File} file - The file to upload
 * @param {string} path - The storage path
 * @returns {Promise<string>} - A promise that resolves to the download URL
 */
export const directUploadImage = async (file, path) => {
  try {
    // --- Get Auth Token --- 
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated for direct upload.');
    }
    const token = await user.getIdToken();
    // --- End Auth Token --- 

    // Construct the upload URL for the Firebase Storage REST API
    const projectId = 'mahalorewardscard';
    const encodedPath = encodeURIComponent(path);
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o/${encodedPath}`;
    
    console.log('Attempting direct upload to:', uploadUrl);
    
    // Firebase storage requires raw binary data, not FormData for REST API
    // Read the file as an ArrayBuffer
    const fileData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
    
    // Upload using fetch API instead of Firebase SDK
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: fileData,
      headers: {
        'Content-Type': file.type,
        'Authorization': `Bearer ${token}` // Add Auth header
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload response error:', errorText);
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    // Parse the response to get the token
    const data = await response.json();
    console.log('Upload response:', data);
    
    // Construct the download URL
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o/${encodedPath}?alt=media`;
    
    return downloadUrl;
  } catch (error) {
    console.error('Direct upload failed:', error);
    // Fall back to regular upload if direct upload fails
    console.log('Falling back to regular Firebase upload method');
    return uploadImage(file, path);
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
    try {
      return await getDownloadURL(storageRef);
    } catch (urlError) {
      // If there's a CORS error, use the fallback approach
      if (urlError.code === 'storage/cors-error' || urlError.message.includes('CORS')) {
        console.warn('CORS error detected when getting download URL, using fallback approach');
        // Use the project ID and path to construct a public URL (this is a workaround)
        const projectId = 'mahalorewardscard';
        const encodedPath = encodeURIComponent(path);
        return `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o/${encodedPath}?alt=media`;
      }
      throw urlError;
    }
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
        try {
          const url = await getDownloadURL(itemRef);
          return {
            name: itemRef.name,
            url,
            fullPath: itemRef.fullPath
          };
        } catch (urlError) {
          // If there's a CORS error, use the fallback approach
          if (urlError.code === 'storage/cors-error' || urlError.message.includes('CORS')) {
            console.warn('CORS error detected when getting download URL, using fallback approach');
            // Use the project ID and path to construct a public URL
            const projectId = 'mahalorewardscard';
            const encodedPath = encodeURIComponent(itemRef.fullPath);
            const url = `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o/${encodedPath}?alt=media`;
            
            return {
              name: itemRef.name,
              url,
              fullPath: itemRef.fullPath
            };
          }
          throw urlError;
        }
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

/**
 * Convert a file to base64 format
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Promise resolving to base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Generate a unique ID for an image
 * @returns {string} - A unique image ID
 */
export const generateImageId = () => {
  return `img_${uuidv4().replace(/-/g, '')}`;
};

/**
 * Uploads a file to Firebase Storage.
 * @param {File} file - The file to upload.
 * @param {string} path - The path in Firebase Storage to upload to.
 * @param {function} progressCallback - A callback function that receives upload progress data.
 * @returns {Promise<string>} A promise that resolves with the download URL of the uploaded file.
 */
export const uploadFile = (file, path, progressCallback) => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (progressCallback) {
          progressCallback(progress);
        }
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          console.error('Error getting download URL:', error);
          reject(error);
        }
      }
    );
  });
};

/**
 * Deletes a file from Firebase Storage.
 * @param {string} fullPath - The full path to the file in Firebase Storage.
 * @returns {Promise<void>} A promise that resolves when the file is deleted.
 */
export const deleteFile = async (fullPath) => {
  try {
    const fileRef = ref(storage, fullPath);
    await deleteObject(fileRef);
    console.log('File deleted successfully');
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Extracts the file name from a URL.
 * @param {string} url - The URL to extract the file name from.
 * @returns {string|null} The file name, or null if it couldn't be extracted.
 */
export const getFileNameFromUrl = (url) => {
  if (!url) return null;
  try {
    // Extract file name from full URL
    const matches = url.match(/\/([^/?#]+)[^/]*$/);
    if (matches && matches.length > 1) {
      return matches[1];
    }
    return null;
  } catch (error) {
    console.error('Error extracting file name:', error);
    return null;
  }
};

/**
 * Builds a storage path for an image
 * @param {string} basePath - The base storage path
 * @param {string} id - The image ID
 * @returns {string} - The complete storage path
 */
export const buildImagePath = (basePath, id) => {
  return `${basePath}/${id}`;
};

/**
 * Creates an image object for storage in Firestore
 * @param {string} url - The URL or base64 data of the image
 * @param {string} id - The unique ID of the image
 * @param {boolean} isBase64 - Whether the image is stored as base64
 * @returns {object} - The image object for Firestore
 */
export const createImageObject = (url, id, isBase64 = false) => {
  return {
    url,
    id,
    isBase64,
    timestamp: new Date().toISOString()
  };
};

// Export all functions
export default {
  uploadImage,
  directUploadImage,
  deleteImage,
  getImageUrl,
  listImages,
  generateUniqueFilename,
  getFilenameFromPath,
  fileToBase64,
  generateImageId,
  uploadFile,
  deleteFile,
  getFileNameFromUrl,
  buildImagePath,
  createImageObject
}; 