import React, { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getItem, createItem, updateItem } from '../../services/firestoreService.js';
import Select from 'react-select';
import { db, auth } from '../../services/firebase.js';
import MapPicker from '../map/MapPicker.js';
import { ALL_TAGS } from '../../utils/constants.js';
import './ItemForm.css';
import { 
  Box, 
  TextField, 
  Button, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Typography, 
  Paper, 
  CircularProgress, 
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
  Select as MuiSelect,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import ImageUploader from '../common/ImageUploader.js';
import DraggableGallery from '../common/DraggableGallery.js';

// Rich text editor imports
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

// Form steps based on CURRENT_TICKET.md
const FORM_STEPS = {
  INITIAL_SELECTION: 0,
  BASIC_INFO: 1,
  LOCATION_DETAILS: 2,
  VENDOR_SPECIFIC: 3,
  VISUAL_PRESENTATION: 4
};

// Prepare options for react-select
const tagOptions = ALL_TAGS.map(tag => ({
  value: tag,
  label: tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) // Format label
}));

function ItemForm({ itemId, onSubmissionSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    type: 'poi',
    icon: '',
    name: '',
    description: {
      brief: '',
      detailed: '',
      bestTime: '',
      weatherNotes: ''
    },
    location: {
      coordinates: {
        lat: '',
        lng: ''
      },
      parking: {
        availability: 'none',
        description: '',
        coordinates: {
          lat: '',
          lng: ''
        },
        cost: ''
      }
    },
    presentation: {
      container: {
        opacity: 100,
        blur: 0,
        backgroundColor: '#ffffff'
      },
      headerImage: null,
      gallery: []
    },
    tags: [],
    deals: [],
    status: {
      isActive: true,
      createdAt: null,
      updatedAt: null
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const latestCoordsRef = useRef({ lat: null, lng: null }); // Ref for latest coords
  const isMountedRef = useRef(true);

  // Add state for rich text editor
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    // Set mounted flag to true when component mounts
    isMountedRef.current = true;

    // Reset general state fields first
    setFormData(prevData => ({
      ...prevData, // Keep potentially existing structure
      type: 'poi',
      icon: '',
      name: '',
      description: { brief: '', detailed: '', bestTime: '', weatherNotes: '' },
      location: { 
          ...prevData.location, // Keep parking, etc.
          coordinates: { lat: '', lng: '' } // Reset only coords state
      },
      presentation: { 
          ...prevData.presentation, // Keep container, etc.
          headerImage: null, 
          gallery: [] 
      },
      tags: [],
      deals: [],
      status: { isActive: true, createdAt: null, updatedAt: null }
    }));
    setValidationErrors({});
    setFetchError(null);
    setSubmitError(null);
    setLoading(false);
    
    // Explicitly reset ref only when creating new or itemId changes
    latestCoordsRef.current = { lat: null, lng: null }; 

    if (itemId) {
      console.log(`Editing item with ID: ${itemId}`);
      setIsEditing(true);
      setLoading(true);
      getItem(itemId)
        .then(itemData => {
          if (!isMountedRef.current) return; // Check if component is still mounted

          if (itemData) {
            console.log("Fetched item data:", itemData);
            
            // Build the state object matching the form's expected structure
            // Map fields from itemData (potentially flat) to formData (nested)
            const stateData = {
                ...formData, // Start with default structure
                ...itemData, // Spread top-level fields first

                // Explicitly map potentially misplaced fields
                name: itemData.name || formData.name,
                type: itemData.type || formData.type,
                tags: itemData.tags || formData.tags,
                status: { // Merge status carefully
                     ...formData.status,
                     ...(itemData.status || {})
                 },

                // Map description fields
                description: {
                    ...formData.description,
                    ...(itemData.description || {})
                },

                // Map location fields (assuming coordinates/parking might be top-level in fetched data)
                location: {
                    ...formData.location,
                    coordinates: {
                        lat: itemData.coordinates?.lat ?? formData.location.coordinates.lat,
                        lng: itemData.coordinates?.lng ?? formData.location.coordinates.lng,
                    },
                    parking: {
                        ...formData.location.parking,
                        ...(itemData.parking || {}), // Map top-level parking if it exists
                        // Map parking coordinates if they exist nested within parking
                        coordinates: {
                             lat: itemData.parking?.coordinates?.lat ?? formData.location.parking.coordinates.lat,
                             lng: itemData.parking?.coordinates?.lng ?? formData.location.parking.coordinates.lng,
                        }
                    },
                     // Include other fields from itemData.location if they exist
                    ...(itemData.location || {}), 
                },

                // Map presentation fields (assuming icon might be top-level)
                presentation: {
                    ...formData.presentation,
                     ...(itemData.presentation || {}), // Spread presentation object first
                     icon: itemData.icon ?? formData.presentation.icon, // Map top-level icon
                     container: {
                        ...formData.presentation.container,
                        ...((itemData.presentation && itemData.presentation.container) || {})
                     },
                     headerImage: itemData.presentation?.headerImage || null,
                     gallery: itemData.presentation?.gallery || [],
                },
            };
            
             // Ensure coordinates are suitable for form state (number or empty string)
            let initialLat = null, initialLng = null;
            if (stateData.location.coordinates) {
                const parsedLat = stateData.location.coordinates.lat ? parseFloat(stateData.location.coordinates.lat) : NaN;
                const parsedLng = stateData.location.coordinates.lng ? parseFloat(stateData.location.coordinates.lng) : NaN;
                stateData.location.coordinates.lat = !isNaN(parsedLat) ? parsedLat : '';
                stateData.location.coordinates.lng = !isNaN(parsedLng) ? parsedLng : '';
                if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                   initialLat = parsedLat;
                   initialLng = parsedLng;
                }
            }
             if (stateData.location.parking?.coordinates) {
                 stateData.location.parking.coordinates.lat = stateData.location.parking.coordinates.lat ? parseFloat(stateData.location.parking.coordinates.lat) : null;
                 stateData.location.parking.coordinates.lng = stateData.location.parking.coordinates.lng ? parseFloat(stateData.location.parking.coordinates.lng) : null;
             }

            if (isMountedRef.current) {
              console.log("State data prepared for form:", stateData);
              setFormData(stateData); // Set the correctly structured state
              // Update ref with initial valid coords if available
              latestCoordsRef.current = { lat: initialLat, lng: initialLng };

              // Set editor state from detailed description HTML
              const detailedHtml = itemData.description?.detailed || '';
              setEditorState(convertHtmlToEditorState(detailedHtml));
            }
          } else {
            if (isMountedRef.current) {
              console.error('Item not found for ID:', itemId);
              setFetchError('Item not found.');
            }
          }
        })
        .catch(err => {
          if (isMountedRef.current) {
            console.error("Error fetching item:", err);
            setFetchError('Failed to load item data.');
          }
        })
        .finally(() => {
          if (isMountedRef.current) {
            setLoading(false);
          }
        });
    } else {
      console.log("Creating new item - ref reset in useEffect");
      setIsEditing(false);
    }

    // Cleanup function to set mounted flag to false when unmounting
    return () => {
      console.log("ItemForm component unmounting");
      isMountedRef.current = false;
    };
  }, [itemId]);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;

    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prevData => {
        let currentLevel = { ...prevData };
        let ref = currentLevel;

        for (let i = 0; i < keys.length - 1; i++) {
          if (ref[keys[i]] === undefined || ref[keys[i]] === null) {
             ref[keys[i]] = {};
          } else {
            ref[keys[i]] = { ...ref[keys[i]] }; 
          }
          ref = ref[keys[i]];
        }
        ref[keys[keys.length - 1]] = value;
        return currentLevel;
      });
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  }, []);
  
  const handleMuiSelectChange = (event) => {
     handleChange(event);
  };

  const handleTagsChange = useCallback((selectedOptions) => {
    setFormData(prevData => ({
      ...prevData,
      tags: selectedOptions ? selectedOptions.map(option => option.value) : []
    }));
  }, []);

  const handleLocationChange = (lat, lng) => {
    console.log("MapPicker coords:", { lat, lng });
    const parsedLat = typeof lat === 'number' ? lat : parseFloat(lat);
    const parsedLng = typeof lng === 'number' ? lng : parseFloat(lng);

    // Update ref immediately
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      latestCoordsRef.current = { lat: parsedLat, lng: parsedLng };
    } else {
      latestCoordsRef.current = { lat: null, lng: null }; // Clear if invalid
    }

    // Update state for display/controlled component
    setFormData(prevData => ({
      ...prevData,
      location: {
        ...prevData.location,
        coordinates: { 
          lat: isNaN(parsedLat) ? '' : parsedLat,
          lng: isNaN(parsedLng) ? '' : parsedLng 
        }
      }
    }));
  };

  // Handle parking location coordinates change
  const handleParkingLocationChange = (lat, lng) => {
    const parsedLat = typeof lat === 'number' ? lat : parseFloat(lat);
    const parsedLng = typeof lng === 'number' ? lng : parseFloat(lng);

    // Update state for display/controlled component
    setFormData(prevData => ({
      ...prevData,
      location: {
        ...prevData.location,
        parking: {
          ...prevData.location.parking,
          coordinates: { 
            lat: isNaN(parsedLat) ? '' : parsedLat,
            lng: isNaN(parsedLng) ? '' : parsedLng 
          }
        }
      }
    }));
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;
    console.log("Validating form data:", formData); // Add log to see state at validation time
    console.log("Latest coords ref:", latestCoordsRef.current); // Log ref as well

    // Basic Info Validation
    if (!formData.name.trim()) {
      errors.name = 'Item Name is required.';
      isValid = false;
    }
    if (!formData.type) {
      errors.type = 'Item Type is required.';
      isValid = false;
    }

    // Location Validation
    const stateLat = formData.location?.coordinates?.lat;
    const stateLng = formData.location?.coordinates?.lng;
    const refLat = latestCoordsRef.current?.lat;
    const refLng = latestCoordsRef.current?.lng;

    // Determine the most reliable latitude value for validation
    let latToValidate = stateLat;
    // Use ref value ONLY if state value is empty/null/undefined AND ref value is not null/undefined
    if ((stateLat === '' || stateLat === null || stateLat === undefined) && (refLat !== null && refLat !== undefined)) {
        console.log("Validation using refLat as stateLat is empty/invalid.");
        latToValidate = refLat;
    }

    // Determine the most reliable longitude value for validation
    let lngToValidate = stateLng;
    // Use ref value ONLY if state value is empty/null/undefined AND ref value is not null/undefined
    if ((stateLng === '' || stateLng === null || stateLng === undefined) && (refLng !== null && refLng !== undefined)) {
        console.log("Validation using refLng as stateLng is empty/invalid.");
        lngToValidate = refLng;
    }

    // Perform validation on the chosen values (could be from state or ref)
    // Check if the value is empty OR if it's not parseable as a number
    if (latToValidate === '' || latToValidate === null || latToValidate === undefined || isNaN(parseFloat(latToValidate))) {
         console.log(`Latitude validation failed. Value: ${latToValidate}, Type: ${typeof latToValidate}`);
         errors.locationCoordinates = 'Valid Latitude is required.';
         isValid = false;
    }
    if (lngToValidate === '' || lngToValidate === null || lngToValidate === undefined || isNaN(parseFloat(lngToValidate))) {
         console.log(`Longitude validation failed. Value: ${lngToValidate}, Type: ${typeof lngToValidate}`);
         errors.locationCoordinates = errors.locationCoordinates ? 'Valid Latitude and Longitude are required.' : 'Valid Longitude is required.';
         isValid = false;
    }


    // Add other validations as needed (e.g., parking details if required based on availability)

    setValidationErrors(errors);
    console.log("Validation result:", isValid, "Errors:", errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setSubmitError("Please fix the errors in the form.");
      return;
    }

    if (!isMountedRef.current) return; // Check mounted before proceeding
    
    setLoading(true);
    setSubmitError(null);
    setValidationErrors({});

    const dataToSubmit = {
      ...formData,
      location: {
        ...formData.location,
        coordinates: {
          lat: parseFloat(formData.location.coordinates.lat) || 0,
          lng: parseFloat(formData.location.coordinates.lng) || 0,
        },
        parking: {
          ...formData.location.parking,
           coordinates: {
               lat: parseFloat(formData.location.parking.coordinates.lat) || null,
               lng: parseFloat(formData.location.parking.coordinates.lng) || null,
           }
        }
      },
      tags: formData.tags || [], 
    };

    if (dataToSubmit.id) {
       delete dataToSubmit.id;
    }
    if (dataToSubmit.status) {
        delete dataToSubmit.status.createdAt;
        delete dataToSubmit.status.updatedAt;
    }

    console.log("Submitting data:", dataToSubmit);

    try {
      if (isEditing) {
        console.log(`Updating item ${itemId}`);
        await updateItem(itemId, dataToSubmit);
        console.log('Item updated successfully');
      } else {
         console.log("Creating new item");
        const newId = await createItem(dataToSubmit);
        console.log('Item created successfully with ID:', newId);
      }
       localStorage.removeItem('itemFormDraft');
      if (isMountedRef.current && onSubmissionSuccess) {
        onSubmissionSuccess();
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      if (isMountedRef.current) {
        setSubmitError(err.message || 'Failed to save item.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Function to handle editor state changes
  const handleEditorStateChange = (newEditorState) => {
    setEditorState(newEditorState);
    
    // Update formData with HTML content
    const htmlContent = draftToHtml(convertToRaw(newEditorState.getCurrentContent()));
    setFormData(prev => ({
      ...prev,
      description: {
        ...prev.description,
        detailed: htmlContent
      }
    }));
  };

  // Function to convert HTML to editor state
  const convertHtmlToEditorState = (html) => {
    if (!html || html === '') {
      return EditorState.createEmpty();
    }
    
    try {
      const contentBlock = htmlToDraft(html);
      if (contentBlock) {
        const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
        return EditorState.createWithContent(contentState);
      }
    } catch (error) {
      console.error('Error converting HTML to editor state:', error);
    }
    
    return EditorState.createEmpty();
  };

  // Handle header image upload
  const handleHeaderImageUpload = (imageUrl, imagePath) => {
    setFormData(prevData => ({
      ...prevData,
      presentation: {
        ...prevData.presentation,
        headerImage: {
          url: imageUrl,
          alt: formData.name || 'Header image',
          path: imagePath
        }
      }
    }));
  };

  // Handle header image deletion
  const handleHeaderImageDelete = () => {
    setFormData(prevData => ({
      ...prevData,
      presentation: {
        ...prevData.presentation,
        headerImage: {
          url: '',
          alt: '',
          path: ''
        }
      }
    }));
  };

  // Handle gallery images upload
  const handleGalleryImagesUpload = (newImages) => {
    setFormData(prevData => ({
      ...prevData,
      presentation: {
        ...prevData.presentation,
        gallery: [...prevData.presentation.gallery, ...newImages]
      }
    }));
  };

  // Handle gallery image deletion
  const handleGalleryImageDelete = (index) => {
    setFormData(prevData => {
      const updatedGallery = [...prevData.presentation.gallery];
      updatedGallery.splice(index, 1);
      
      return {
        ...prevData,
        presentation: {
          ...prevData.presentation,
          gallery: updatedGallery
        }
      };
    });
  };

  // Handle gallery image reordering
  const handleGalleryReorder = (newOrderedGallery) => {
    setFormData(prevData => ({
      ...prevData,
      presentation: {
        ...prevData.presentation,
        gallery: newOrderedGallery
      }
    }));
  };

  // Handle preview image
  const handlePreviewImage = (imageUrl) => {
    setPreviewImage(imageUrl);
    setPreviewOpen(true);
  };

  // Close preview dialog
  const closePreview = () => {
    setPreviewOpen(false);
  };

  if (loading && isEditing && !fetchError) {
    return <div className="loading-indicator">Loading item data...</div>;
  }

  if (fetchError) {
    return <div className="error-message fetch-error">Error: {fetchError}</div>;
  }

  const isSubmitDisabled = loading;

  return (
    <form onSubmit={handleSubmit} className="item-form modern" noValidate>
      <div className="form-header">
        <h2>{isEditing ? `Edit Item: ${formData.name || '(Loading...)'}` : 'Create New Item'}</h2>
      </div>

      <div className="form-sections">
        <div className={`form-section active`}>
          <div className="section-header">
            <h3>Basic Details</h3>
          </div>
          <div className="section-content">
            <div className="form-group">
              <label htmlFor="item-type">Type *</label>
              <select
                id="item-type"
                name="type"
                value={formData.type || ''}
                onChange={handleChange}
                required
                className={validationErrors.type ? 'error' : ''}
              >
                <option value="" disabled>Select Type</option>
                <option value="poi">Point of Interest (POI)</option>
                <option value="vendor">Vendor</option>
              </select>
              {validationErrors.type && <p className="error-message">{validationErrors.type}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="item-name">Name *</label>
              <input
                type="text"
                id="item-name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                placeholder="Enter the name of the item"
                className={validationErrors.name ? 'error' : ''}
              />
              {validationErrors.name && <p className="error-message">{validationErrors.name}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="presentation.icon">Icon (Text/Emoji)</label>
              <input
                type="text"
                id="presentation.icon"
                name="presentation.icon"
                value={formData.presentation?.icon || ''}
                onChange={handleChange}
                placeholder="Enter icon text or emoji 📍"
              />
            </div>
           
            <div className="form-group">
              <label htmlFor="description.brief">Brief Description * (for map tooltips)</label>
              <input
                type="text"
                id="description.brief"
                name="description.brief"
                value={formData.description?.brief || ''}
                onChange={handleChange}
                placeholder="Brief description"
                maxLength={150}
                required
                className={validationErrors.brief ? 'error' : ''}
              />
              {validationErrors.brief && <p className="error-message">{validationErrors.brief}</p>}
            </div>
            
            <div className="form-group">
                <label htmlFor="description.detailed">Detailed Description</label>
                <textarea
                    id="description.detailed"
                    name="description.detailed"
                    value={formData.description?.detailed || ''}
                    onChange={handleChange}
                    placeholder="Detailed description (Markdown supported?)"
                    rows={5}
                />
            </div>

            {/* Rich Text Editor for Detailed Description */}
            <div className="form-group">
              <label htmlFor="detailed-description">Detailed Description <span className="helper-text">(rich text format)</span></label>
              <div className="rich-text-editor-container">
                <Editor
                  editorState={editorState}
                  wrapperClassName="rich-text-editor-wrapper"
                  editorClassName="rich-text-editor"
                  onEditorStateChange={handleEditorStateChange}
                  toolbar={{
                    options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'history', 'embedded', 'emoji', 'image'],
                    inline: { inDropdown: false },
                    list: { inDropdown: true },
                    textAlign: { inDropdown: true },
                    link: { inDropdown: true },
                    history: { inDropdown: false },
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={`form-section active`}>
          <div className="section-header">
            <h3>Location & Parking</h3>
          </div>
          <div className="section-content">
            <div className="form-group">
              <label>Location *</label>
              <MapPicker 
                initialLat={parseFloat(formData.location?.coordinates?.lat) || undefined}
                initialLng={parseFloat(formData.location?.coordinates?.lng) || undefined}
                onLocationSelect={handleLocationChange}
              />
              {validationErrors.locationCoordinates && <span className="error-message">{validationErrors.locationCoordinates}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="parking-availability">Parking Availability</label>
              <select
                id="parking-availability"
                name="location.parking.availability"
                value={formData.location?.parking?.availability || 'none'}
                onChange={handleChange}
              >
                <option value="none">None</option>
                <option value="limited">Limited</option>
                <option value="ample">Ample</option>
              </select>
            </div>

            {formData.location?.parking?.availability !== 'none' && (
              <>
                <div className="form-group">
                  <label htmlFor="parking-description">Parking Description</label>
                  <textarea
                    id="parking-description"
                    name="location.parking.description"
                    value={formData.location?.parking?.description || ''}
                    onChange={handleChange}
                    placeholder="Describe parking situation (e.g., street parking, paid lot)"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="location.parking.cost">Parking Cost</label>
                  <input
                    type="text"
                    id="location.parking.cost"
                    name="location.parking.cost"
                    value={formData.location?.parking?.cost || ''}
                    onChange={handleChange}
                    placeholder="e.g., Free, $5/hour"
                  />
                </div>
                
                {/* Add MapPicker for parking coordinates */}
                <div className="form-group">
                  <label>
                    Parking Location Coordinates 
                    <span className="helper-text">(where visitors should park)</span>
                  </label>
                  <MapPicker 
                    initialLat={parseFloat(formData.location?.parking?.coordinates?.lat) || undefined}
                    initialLng={parseFloat(formData.location?.parking?.coordinates?.lng) || undefined}
                    onLocationSelect={handleParkingLocationChange}
                    label="Parking Location"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className={`form-section active`}>
          <div className="section-header">
            <h3>Tags</h3>
          </div>
          <div className="section-content">
            <div className="form-group">
              <label htmlFor="tags-select">Select Relevant Tags</label>
              <Select
                id="tags-select"
                isMulti
                name="tags"
                options={tagOptions}
                className="basic-multi-select"
                classNamePrefix="select"
                value={tagOptions.filter(option => (formData.tags || []).includes(option.value))}
                onChange={handleTagsChange}
                placeholder="Search and select tags..."
              />
            </div>
          </div>
        </div>
        
        <div className={`form-section active`}>
          <div className="section-header">
            <h3>Visual Presentation</h3>
          </div>
          <div className="section-content">
            <div className="form-group">
              <label htmlFor="presentation.container.backgroundColor">Background Color</label>
              <input
                type="color"
                id="presentation.container.backgroundColor"
                name="presentation.container.backgroundColor"
                value={formData.presentation?.container?.backgroundColor || '#ffffff'}
                onChange={handleChange}
                className="color-input"
              />
            </div>

            <div className="form-group slider-group">
              <label htmlFor="presentation.container.opacity">
                Background Opacity: {formData.presentation?.container?.opacity !== undefined ? formData.presentation.container.opacity : 100}%
              </label>
              <input
                type="range"
                id="presentation.container.opacity"
                name="presentation.container.opacity"
                min="0"
                max="100"
                step="1"
                value={formData.presentation?.container?.opacity !== undefined ? formData.presentation.container.opacity : 100}
                onChange={handleChange}
                className="slider-input"
              />
            </div>

            <div className="form-group slider-group">
              <label htmlFor="presentation.container.blur">
                Background Blur: {formData.presentation?.container?.blur !== undefined ? formData.presentation.container.blur : 0}px
              </label>
              <input
                type="range"
                id="presentation.container.blur"
                name="presentation.container.blur"
                min="0"
                max="20" // Max blur as per spec
                step="1"
                value={formData.presentation?.container?.blur !== undefined ? formData.presentation.container.blur : 0}
                onChange={handleChange}
                className="slider-input"
              />
            </div>

            {/* Header Image Upload */}
            <div className="form-group">
              <ImageUploader
                title="Header Image"
                imageUrl={formData.presentation?.headerImage?.url || ''}
                storagePath={itemId ? `items/${itemId}/header` : 'items/temp/header'}
                onImageUploaded={handleHeaderImageUpload}
                onImageDeleted={handleHeaderImageDelete}
                buttonLabel="Upload Header Image"
              />
            </div>

            {/* Gallery Images Upload */}
            <div className="form-group">
              <ImageUploader
                title="Gallery Images"
                allowMultiple={true}
                images={formData.presentation?.gallery || []}
                storagePath={itemId ? `items/${itemId}/gallery` : 'items/temp/gallery'}
                onImageUploaded={handleGalleryImagesUpload}
                onImageDeleted={handleGalleryImageDelete}
                buttonLabel="Add Gallery Images"
              />
              
              {/* Gallery order management */}
              {formData.presentation?.gallery?.length > 1 && (
                <DraggableGallery
                  images={formData.presentation.gallery}
                  onReorder={handleGalleryReorder}
                  onDelete={handleGalleryImageDelete}
                  onPreview={handlePreviewImage}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
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

      <div className="form-actions">
        {submitError && (
          <div className="submit-error error-message">Error: {submitError}</div>
        )}
        <button 
          type="button" 
          onClick={onCancel} 
          className="cancel-button" 
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="submit-button" disabled={isSubmitDisabled}>
          {loading && !fetchError ? 'Saving...' : (isEditing ? 'Update Item' : 'Create Item')}
        </button>
      </div>
    </form>
  );
}

ItemForm.propTypes = {
  itemId: PropTypes.string,
  onSubmissionSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ItemForm; 