import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Paper, 
  IconButton, 
  Typography,
  Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './DraggableGallery.css';

// SortableItem component
const SortableGalleryItem = ({ image, index, onDelete, onPreview }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${image.path}-${index}` });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
  };

  return (
    <Grid item xs={6} sm={4} md={3} style={style}>
      <Paper 
        elevation={isDragging ? 6 : 1} 
        className="gallery-item"
        ref={setNodeRef}
      >
        <Box 
          className="drag-handle" 
          {...attributes} 
          {...listeners}
        >
          <DragIndicatorIcon />
        </Box>
        
        <img 
          src={image.url} 
          alt={image.alt || `Gallery ${index}`} 
          className="gallery-image"
        />
        
        <Box className="order-badge">
          {index + 1}
        </Box>
        
        <Box className="image-actions">
          <IconButton
            aria-label="preview"
            onClick={() => onPreview(image.url)}
            size="small"
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton
            aria-label="delete"
            onClick={() => onDelete(index)}
            size="small"
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Paper>
    </Grid>
  );
};

const DraggableGallery = ({ images, onReorder, onDelete, onPreview }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = () => {
    setIsDragging(true);
  };
  
  const handleDragEnd = (event) => {
    setIsDragging(false);
    
    const { active, over } = event;
    
    if (active.id !== over.id) {
      // Find the index of the items
      const activeIndex = images.findIndex((_, index) => 
        `${images[index].path}-${index}` === active.id
      );
      const overIndex = images.findIndex((_, index) => 
        `${images[index].path}-${index}` === over.id
      );
      
      // Create the new array with reordered items
      const reorderedImages = arrayMove(images, activeIndex, overIndex);
      
      // Update the order property for each image
      const updatedImages = reorderedImages.map((image, index) => ({
        ...image,
        order: index
      }));
      
      // Call the onReorder callback with the new order
      onReorder(updatedImages);
    }
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <Box className="draggable-gallery">
      <Typography variant="subtitle2" gutterBottom>
        Gallery Order (drag to reorder)
      </Typography>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={images.map((image, index) => `${image.path}-${index}`)}
          strategy={rectSortingStrategy}
        >
          <Grid 
            container 
            spacing={2}
            className={`gallery-grid ${isDragging ? 'dragging' : ''}`}
          >
            {images.map((image, index) => (
              <SortableGalleryItem
                key={`${image.path}-${index}`}
                image={image}
                index={index}
                onDelete={onDelete}
                onPreview={onPreview}
              />
            ))}
          </Grid>
        </SortableContext>
      </DndContext>
    </Box>
  );
};

DraggableGallery.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
      alt: PropTypes.string,
      order: PropTypes.number
    })
  ).isRequired,
  onReorder: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPreview: PropTypes.func.isRequired
};

SortableGalleryItem.propTypes = {
  image: PropTypes.shape({
    url: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    alt: PropTypes.string,
    order: PropTypes.number
  }).isRequired,
  index: PropTypes.number.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPreview: PropTypes.func.isRequired
};

export default DraggableGallery; 