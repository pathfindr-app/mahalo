import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Button, 
  Box, 
  CircularProgress, 
  IconButton, 
  Typography, 
  Paper,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import VisibilityIcon from '@mui/icons-material/Visibility';

/**
 * A direct image uploader that stores images as base64 data in Firestore
 * This completely bypasses Firebase Storage and CORS issues
 */
const DirectImageUploader = ({
  title = 'Upload Image',
  onImageUploaded,
  onImageDeleted,
  storagePath,
  initialImage = null
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [image, setImage] = useState(initialImage);
  const fileInputRef = useRef(null);

  // Helper function to generate a unique filename
  const generateUniqueId = () => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `img-${timestamp}-${randomString}`;
  };

  const validateFile = (file) => {
    // Check file size (limit to 1MB for base64 storage)
    if (file.size > 1024 * 1024) {
      return 'File size exceeds 1MB limit for inline storage';
    }

    // Check file type (only allow images)
    if (!file.type.match('image.*')) {
      return 'Only image files are allowed';
    }

    return null;
  };

  // Convert file to base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Generate a unique ID
      const id = generateUniqueId();
      const path = `${storagePath}/${id}`;
      
      // Show a temporary preview immediately
      const previewUrl = URL.createObjectURL(file);
      const tempImage = {
        url: previewUrl,
        path: path,
        isPreview: true
      };
      setImage(tempImage);
      
      // Convert the file to base64
      const base64Data = await convertToBase64(file);
      
      // Create final image data
      const finalImage = {
        url: base64Data,  // Store base64 directly as URL
        path: path,
        isPreview: false,
        type: file.type,
        name: file.name,
        size: file.size,
        timestamp: Date.now()
      };
      
      // Update the component state
      setImage(finalImage);
      
      // Notify the parent component
      if (onImageUploaded) {
        onImageUploaded(base64Data, path);
      }
      
      // Release the object URL to prevent memory leaks
      URL.revokeObjectURL(previewUrl);
      
    } catch (err) {
      console.error('Image processing failed:', err);
      setError(`Failed to process image: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = () => {
    if (!image) return;
    
    // Clear the image first from UI
    setImage(null);
    
    // Notify parent (actual deletion happens in parent component)
    if (onImageDeleted) {
      onImageDeleted(image.path);
    }
  };

  return (
    <div className="direct-image-uploader">
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="direct-image-upload"
        />
        <label htmlFor="direct-image-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<AddPhotoAlternateIcon />}
            disabled={uploading}
          >
            {image ? 'Replace Image' : 'Upload Image'}
          </Button>
        </label>
        {uploading && (
          <CircularProgress size={24} sx={{ ml: 2 }} />
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {image && image.url && (
        <Paper 
          elevation={2} 
          sx={{ 
            position: 'relative',
            width: '100%',
            maxWidth: 300,
            maxHeight: 200,
            overflow: 'hidden',
            mb: 2
          }}
        >
          <img 
            src={image.url} 
            alt="Uploaded" 
            style={{ 
              width: '100%',
              height: 'auto',
              display: 'block',
              opacity: image.isPreview ? 0.7 : 1
            }} 
          />
          <Box 
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              display: 'flex',
              gap: 1,
              backgroundColor: 'rgba(255,255,255,0.7)',
              borderRadius: 1,
              padding: 0.5
            }}
          >
            <IconButton 
              size="small"
              onClick={() => window.open(image.url, '_blank')}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              color="error"
              onClick={handleDelete}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
          {image.isPreview && (
            <Box 
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: 'white'
              }}
            >
              <Typography>Processing...</Typography>
            </Box>
          )}
        </Paper>
      )}
    </div>
  );
};

DirectImageUploader.propTypes = {
  title: PropTypes.string,
  onImageUploaded: PropTypes.func.isRequired,
  onImageDeleted: PropTypes.func,
  storagePath: PropTypes.string.isRequired,
  initialImage: PropTypes.shape({
    url: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired
  })
};

export default DirectImageUploader; 