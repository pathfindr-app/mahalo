import React, { useState, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
  Button, 
  Box, 
  CircularProgress, 
  IconButton, 
  Typography, 
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import { uploadFile, deleteImage } from '../../services/storageService.js';
import { auth } from '../../services/firebase.js';
import './ImageUploader.css';

// Helper to generate a simple random string for IDs
const generateRandomId = () => Math.random().toString(36).substring(2, 10);

const ImageUploader = ({
  imageUrl,
  storagePath,
  onImageUploaded,
  onImageDeleted,
  title = 'Upload Image',
  allowMultiple = false,
  images = [],
  buttonLabel = 'Upload Image',
  acceptedFileTypes = 'image/*',
  idSuffix
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // Generate a unique ID for this instance
  const uniqueId = useMemo(() => `image-upload-input-${idSuffix || generateRandomId()}`, [idSuffix]);

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    // Log auth state before attempting upload
    console.log('Current auth state:', auth.currentUser);
    if (!auth.currentUser) {
      setError('User not authenticated. Please log in again.');
      setIsUploading(false);
      return; // Stop if not authenticated
    }

    // Use a progress state for potentially multiple files
    const uploadProgress = {}; 
    const setProgress = (filename, progress) => {
        // TODO: Implement progress display if needed
        console.log(`Progress ${filename}: ${progress}%`);
    }

    try {
      // For single image upload
      if (!allowMultiple) {
        const file = files[0];
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          setIsUploading(false);
          return;
        }

        const filename = generateUniqueFilename(file.name);
        const filePath = `${storagePath}/${filename}`;
        
        console.log(`Uploading file ${filename} via SDK to path: ${filePath}`);
        
        try {
          // Use standard SDK upload method
          const downloadUrl = await uploadFile(file, filePath, (progress) => setProgress(filename, progress));
          
          onImageUploaded(downloadUrl, filePath);
          console.log('SDK Upload successful!', downloadUrl);
        } catch (uploadError) {
          console.error('SDK Upload error details:', uploadError);
          setError(`Failed to upload image: ${uploadError.message || 'Unknown error'}`);
          throw uploadError; // Re-throw to handle in outer catch
        }
      } 
      // For multiple image uploads
      else {
        const uploadedImagesInfo = []; // Store {url, path, alt, order}
        const uploadPromises = [];
        const errors = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const validationError = validateFile(file);
          if (validationError) {
            console.warn(`Skipping file ${file.name}: ${validationError}`);
            errors.push(`${file.name}: ${validationError}`);
            continue;
          }
          
          const filename = generateUniqueFilename(file.name);
          const filePath = `${storagePath}/${filename}`;
          
          console.log(`Uploading gallery file ${filename} via SDK to path: ${filePath}`);

          // Create a promise for each upload
          const uploadPromise = uploadFile(file, filePath, (progress) => setProgress(filename, progress))
            .then(downloadUrl => {
              uploadedImagesInfo.push({
                url: downloadUrl,
                path: filePath,
                alt: filename, 
                order: images.length + i // Maintain order based on original position
              });
              console.log(`Gallery image ${filename} SDK upload successful!`);
            })
            .catch(uploadError => {
              console.error(`Error uploading ${filename} via SDK:`, uploadError);
              errors.push(`${file.name}: ${uploadError.message || 'Upload failed'}`);
            });
            
          uploadPromises.push(uploadPromise);
        }

        // Wait for all uploads to complete
        await Promise.all(uploadPromises);
        
        // Notify parent component about all successfully uploaded images
        if (uploadedImagesInfo.length > 0) {
           // Sort uploaded images based on original index if needed (though order prop should suffice)
           // uploadedImagesInfo.sort((a, b) => a.order - b.order); 
          onImageUploaded(uploadedImagesInfo);
        }
        
        // Set error if any uploads failed
        if (errors.length > 0) {
          if (errors.length === files.length) {
            setError(`All uploads failed. ${errors[0]}`);
          } else {
            setError(`${errors.length} out of ${files.length - errors.length + uploadedImagesInfo.length} uploads failed.`);
          }
        }
      }
    } catch (err) {
      console.error('Image upload process failed:', err);
      if (!error) { // Set a generic error if none was set during individual uploads
        setError('Failed to upload image(s). Please try again.');
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imagePath, index) => {
    try {
      if (!allowMultiple) {
        // For single image
        if (imagePath) {
          await deleteImage(imagePath);
        }
        onImageDeleted();
      } else {
        // For gallery images
        if (imagePath) {
          await deleteImage(imagePath);
        }
        onImageDeleted(index);
      }
    } catch (err) {
      console.error('Failed to delete image:', err);
      setError('Failed to delete image. Please try again.');
    }
  };

  const handlePreview = (imgUrl) => {
    setPreviewImage(imgUrl);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
  };

  // Helper function to validate file type and size
  const validateFile = (file) => {
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return 'File size exceeds 5MB limit';
    }

    // Check file type (only allow images)
    if (!file.type.match('image.*')) {
      return 'Only image files are allowed';
    }

    return null;
  };

  // Helper function to generate a unique filename
  const generateUniqueFilename = (originalName) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${randomString}.${extension}`;
  };

  return (
    <div className="image-uploader">
      <Typography variant="subtitle1" className="uploader-title">
        {title}
      </Typography>

      {/* Image upload button */}
      <Box className="upload-button-container">
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          multiple={allowMultiple}
          id={uniqueId}
        />
        <label htmlFor={uniqueId}>
          <Button
            variant="outlined"
            component="span"
            startIcon={<AddPhotoAlternateIcon />}
            disabled={isUploading}
            className="upload-button"
          >
            {buttonLabel}
          </Button>
        </label>
        {isUploading && <CircularProgress size={24} className="upload-progress" />}
      </Box>

      {/* Error message */}
      {error && (
        <Typography color="error" variant="body2" className="upload-error">
          {error}
        </Typography>
      )}

      {/* Display single image */}
      {!allowMultiple && imageUrl && (
        <Paper elevation={1} className="image-preview-container">
          <img src={imageUrl} alt="Uploaded" className="image-preview" />
          <Box className="image-actions">
            <IconButton
              aria-label="view"
              onClick={() => handlePreview(imageUrl)}
              size="small"
            >
              <VisibilityIcon />
            </IconButton>
            <IconButton
              aria-label="delete"
              onClick={() => handleDeleteImage(storagePath)}
              size="small"
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Paper>
      )}

      {/* Display multiple images as a grid */}
      {allowMultiple && images.length > 0 && (
        <Grid container spacing={2} className="gallery-container">
          {images.map((image, index) => (
            <Grid item xs={6} sm={4} md={3} key={index}>
              <Paper elevation={1} className="gallery-item">
                <img src={image.url} alt={image.alt || `Gallery ${index}`} className="gallery-image" />
                <Box className="image-actions gallery-actions">
                  <IconButton
                    aria-label="view"
                    onClick={() => handlePreview(image.url)}
                    size="small"
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    aria-label="edit"
                    onClick={() => console.log('Edit image:', index)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    aria-label="delete"
                    onClick={() => handleDeleteImage(image.path, index)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={previewOpen} onClose={closePreview} maxWidth="md">
        <DialogTitle>Image Preview</DialogTitle>
        <DialogContent>
          {previewImage && (
            <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '70vh' }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePreview} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

ImageUploader.propTypes = {
  imageUrl: PropTypes.string,
  storagePath: PropTypes.string.isRequired,
  onImageUploaded: PropTypes.func.isRequired,
  onImageDeleted: PropTypes.func.isRequired,
  title: PropTypes.string,
  allowMultiple: PropTypes.bool,
  images: PropTypes.arrayOf(PropTypes.shape({
    url: PropTypes.string.isRequired,
    path: PropTypes.string,
    alt: PropTypes.string,
    order: PropTypes.number
  })),
  buttonLabel: PropTypes.string,
  acceptedFileTypes: PropTypes.string,
  idSuffix: PropTypes.string
};

export default ImageUploader; 