import React, { useState, useRef } from 'react';
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
import { uploadImage, deleteImage } from '../../services/storageService.js';
import './ImageUploader.css';

const ImageUploader = ({
  imageUrl,
  storagePath,
  onImageUploaded,
  onImageDeleted,
  title = 'Upload Image',
  allowMultiple = false,
  images = [],
  buttonLabel = 'Upload Image',
  acceptedFileTypes = 'image/*'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

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

        // Generate a unique path for this file
        const filename = generateUniqueFilename(file.name);
        const filePath = `${storagePath}/${filename}`;
        
        // Upload the file to Firebase Storage
        const downloadUrl = await uploadImage(file, filePath);
        
        // Notify parent component about the uploaded image
        onImageUploaded(downloadUrl, filePath);
      } 
      // For multiple image uploads
      else {
        const uploadedImages = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const validationError = validateFile(file);
          if (validationError) {
            console.warn(`Skipping file ${file.name}: ${validationError}`);
            continue;
          }
          
          // Generate a unique path for this file
          const filename = generateUniqueFilename(file.name);
          const filePath = `${storagePath}/${filename}`;
          
          // Upload the file to Firebase Storage
          const downloadUrl = await uploadImage(file, filePath);
          
          uploadedImages.push({
            url: downloadUrl,
            path: filePath,
            alt: filename,
            order: images.length + i
          });
        }
        
        // Notify parent component about all uploaded images
        if (uploadedImages.length > 0) {
          onImageUploaded(uploadedImages);
        }
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imagePath, index) => {
    try {
      if (!allowMultiple) {
        // For single image
        await deleteImage(imagePath);
        onImageDeleted();
      } else {
        // For gallery images
        await deleteImage(imagePath);
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
          id="image-upload-input"
        />
        <label htmlFor="image-upload-input">
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

      {/* Image preview dialog */}
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
  images: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
      alt: PropTypes.string,
      order: PropTypes.number
    })
  ),
  buttonLabel: PropTypes.string,
  acceptedFileTypes: PropTypes.string
};

export default ImageUploader; 