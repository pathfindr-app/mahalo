import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Button, 
  Box, 
  CircularProgress, 
  IconButton, 
  Typography, 
  Paper,
  Alert,
  Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable gallery item
const SortableImage = ({ image, index, onDelete, onPreview }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = 
    useSortable({ id: image.id || `img-${index}` });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <Grid item xs={6} sm={4} md={3} lg={2} style={style}>
      <Paper 
        elevation={isDragging ? 4 : 1} 
        sx={{ 
          position: 'relative',
          overflow: 'hidden',
          aspectRatio: '1/1',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        ref={setNodeRef}
        {...attributes}
        {...listeners}
      >
        <img 
          src={image.url} 
          alt={image.alt || `Gallery image ${index}`} 
          style={{ 
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: image.isPreview ? 0.7 : 1
          }} 
        />
        
        {/* Order badge */}
        <Box 
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            width: 24,
            height: 24,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14
          }}
        >
          {index + 1}
        </Box>
        
        {/* Actions */}
        <Box 
          sx={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            display: 'flex',
            gap: 0.5,
            backgroundColor: 'rgba(255,255,255,0.7)',
            borderRadius: 1,
            padding: '2px'
          }}
        >
          <IconButton 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(image);
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(index);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
        
        {/* Loading overlay */}
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
              backgroundColor: 'rgba(0,0,0,0.4)',
              color: 'white'
            }}
          >
            <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
            <Typography variant="caption">Processing</Typography>
          </Box>
        )}
      </Paper>
    </Grid>
  );
};

/**
 * A direct gallery uploader that stores images as base64 directly in Firestore
 * This completely bypasses Firebase Storage and CORS issues
 */
const DirectGalleryUploader = ({
  title = 'Gallery Images',
  onImagesUploaded,
  onImagesReordered,
  onImageDeleted,
  storagePath,
  initialImages = []
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [images, setImages] = useState(initialImages.map((img, i) => ({
    ...img,
    id: `img-${i}-${Date.now()}`
  })));
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  
  // For drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Helper function to generate a unique ID
  const generateUniqueId = () => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `img-${timestamp}-${randomString}`;
  };

  const validateFile = (file) => {
    // Check file size (limit to 1MB for base64 storage in Firestore)
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

    setUploading(true);
    setError(null);

    const newImages = [];
    const pendingUploads = [];

    // First create previews for all selected files
    Array.from(files).forEach((file, idx) => {
      const validationError = validateFile(file);
      if (validationError) {
        console.warn(`Skipping file: ${validationError}`);
        return;
      }

      // Generate a unique ID
      const id = generateUniqueId();
      const path = `${storagePath}/${id}`;
      
      // Create a temporary preview with object URL
      const previewUrl = URL.createObjectURL(file);
      const preview = {
        id,
        url: previewUrl,
        path: path,
        alt: file.name,
        isPreview: true
      };
      
      setImages(prev => [...prev, preview]);
      
      // Setup for processing
      pendingUploads.push({ 
        file, 
        id, 
        path, 
        previewUrl 
      });
    });

    // Process files one by one
    const uploadedImages = [];
    const failedUploads = [];
    
    for (const item of pendingUploads) {
      try {
        // Convert the file to base64
        const base64Data = await convertToBase64(item.file);
        
        // Create the final image object
        const finalImage = {
          id: item.id,
          url: base64Data,
          path: item.path,
          alt: item.file.name,
          type: item.file.type,
          size: item.file.size,
          timestamp: Date.now(),
          isPreview: false
        };
        
        uploadedImages.push(finalImage);
        
        // Update the state - replace the preview with the final image
        setImages(prev => prev.map(img => 
          img.id === item.id ? finalImage : img
        ));
        
        // Release object URL to prevent memory leaks
        URL.revokeObjectURL(item.previewUrl);
        
      } catch (err) {
        console.error('Image processing failed:', err);
        failedUploads.push(item);
        
        // Update state to remove the failed upload
        setImages(prev => prev.filter(img => img.id !== item.id));
        
        // Release object URL for failed uploads too
        URL.revokeObjectURL(item.previewUrl);
      }
    }
    
    // Set error if there were failed uploads
    if (failedUploads.length > 0) {
      if (failedUploads.length === pendingUploads.length) {
        setError('All uploads failed. Please try again.');
      } else {
        setError(`${failedUploads.length} of ${pendingUploads.length} uploads failed.`);
      }
    }
    
    // Notify parent about the successful uploads
    if (uploadedImages.length > 0 && onImagesUploaded) {
      onImagesUploaded(uploadedImages);
    }
    
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (index) => {
    const imageToDelete = images[index];
    
    // Update local state first
    setImages(prev => prev.filter((_, idx) => idx !== index));
    
    // Notify parent component
    if (onImageDeleted) {
      onImageDeleted(imageToDelete.path, index);
    }
  };

  const handlePreview = (image) => {
    setPreviewImage(image);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        // Reorder the array
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Notify parent
        if (onImagesReordered) {
          onImagesReordered(newOrder);
        }
        
        return newOrder;
      });
    }
  };

  return (
    <div className="direct-gallery-uploader">
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
          multiple
          id="direct-gallery-upload"
        />
        <label htmlFor="direct-gallery-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<AddPhotoAlternateIcon />}
            disabled={uploading}
          >
            Add Images
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
      
      {images.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            {images.length === 1 ? '1 image' : `${images.length} images`} • Drag to reorder
          </Typography>
          
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={images.map(img => img.id)} 
              strategy={rectSortingStrategy}
            >
              <Grid container spacing={2}>
                {images.map((image, index) => (
                  <SortableImage
                    key={image.id}
                    image={image}
                    index={index}
                    onDelete={handleDelete}
                    onPreview={() => handlePreview(image)}
                  />
                ))}
              </Grid>
            </SortableContext>
          </DndContext>
        </Box>
      )}
      
      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20
          }}
          onClick={closePreview}
        >
          <img 
            src={previewImage.url} 
            alt={previewImage.alt || 'Gallery image'} 
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain'
            }}
            onClick={e => e.stopPropagation()}
          />
          <IconButton
            onClick={closePreview}
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              color: 'white'
            }}
          >
            <DeleteIcon />
          </IconButton>
        </div>
      )}
    </div>
  );
};

SortableImage.propTypes = {
  image: PropTypes.shape({
    id: PropTypes.string,
    url: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    alt: PropTypes.string,
    isPreview: PropTypes.bool
  }).isRequired,
  index: PropTypes.number.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPreview: PropTypes.func.isRequired
};

DirectGalleryUploader.propTypes = {
  title: PropTypes.string,
  onImagesUploaded: PropTypes.func.isRequired,
  onImagesReordered: PropTypes.func,
  onImageDeleted: PropTypes.func,
  storagePath: PropTypes.string.isRequired,
  initialImages: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
      alt: PropTypes.string
    })
  )
};

export default DirectGalleryUploader; 