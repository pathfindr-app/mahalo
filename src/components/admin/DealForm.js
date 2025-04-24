import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Typography, 
  Paper, 
  CircularProgress, 
  Alert,
  Grid,
  MenuItem,
  Select as MuiSelect,
  FormHelperText
} from '@mui/material';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { addDeal, getDeal, updateDeal, queryItems } from '../../services/firestoreService';
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import './DealForm.css';

/**
 * Component for creating and editing deals
 */
const DealForm = ({ dealId, onSubmissionSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    itemId: '',
    vendorName: '',  // Store for display only
    title: '',
    description: '',
    terms: '',
    validity: {
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)) // Default: 1 month from now
    },
    limits: {
      maxClaims: 100,
      perUserLimit: 1
    },
    analytics: {
      totalAvailable: 0,
      currentlyClaimed: 0
    },
    status: {
      isActive: true
    }
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [termsEditorState, setTermsEditorState] = useState(EditorState.createEmpty());
  const [descriptionEditorState, setDescriptionEditorState] = useState(EditorState.createEmpty());
  const [submitting, setSubmitting] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const isMountedRef = useRef(true);
  
  // Load vendors on component mount
  useEffect(() => {
    isMountedRef.current = true;
    loadVendors();

    return () => {
        isMountedRef.current = false;
    };
  }, []);

  // Load deal data if editing an existing deal
  useEffect(() => {
    isMountedRef.current = true;
    if (dealId) {
      setIsEditing(true);
      loadDealData();
    } else {
      setIsEditing(false);
      // Reset form for new deal
      resetForm();
    }

    return () => {
        isMountedRef.current = false;
    };
  }, [dealId]);

  const loadVendors = async () => {
    try {
      if (isMountedRef.current) setLoadingVendors(true);
      const vendorsData = await queryItems({
        type: 'vendor',
        activeOnly: true
      });
       if (isMountedRef.current) setVendors(vendorsData);
    } catch (err) {
      console.error('Error loading vendors:', err);
      if (isMountedRef.current) setFetchError('Failed to load vendors. Please try again.');
    } finally {
      if (isMountedRef.current) setLoadingVendors(false);
    }
  };

  const loadDealData = async () => {
    try {
      if (isMountedRef.current) setLoading(true);
      const result = await getDeal(dealId);
      
      if (result.success && result.data) {
        const dealData = result.data;
        // Format dates if they are Firestore timestamps
        const formattedData = {
          ...dealData,
          validity: {
            startDate: dealData.validity?.startDate?.toDate 
              ? dealData.validity.startDate.toDate() 
              : new Date(dealData.validity?.startDate || Date.now()),
            endDate: dealData.validity?.endDate?.toDate 
              ? dealData.validity.endDate.toDate() 
              : new Date(dealData.validity?.endDate || Date.now()),
          }
        };
        
        if (isMountedRef.current) {
          setFormData(formattedData);
          
          // Set editor states from HTML content
          if (dealData.description) {
            setDescriptionEditorState(convertHtmlToEditorState(dealData.description));
          }
          
          if (dealData.terms) {
            setTermsEditorState(convertHtmlToEditorState(dealData.terms));
          }
          setFetchError(null);
        }
      } else {
         if (isMountedRef.current) setFetchError(result.error || 'Deal not found.');
      }
    } catch (err) {
      console.error('Error loading deal:', err);
       if (isMountedRef.current) setFetchError('Failed to load deal data. Please try again.');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      itemId: '',
      vendorName: '',
      title: '',
      description: '',
      terms: '',
      validity: {
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
      },
      limits: {
        maxClaims: 100,
        perUserLimit: 1
      },
      analytics: {
        totalAvailable: 0,
        currentlyClaimed: 0
      },
      status: {
        isActive: true
      }
    });
    setDescriptionEditorState(EditorState.createEmpty());
    setTermsEditorState(EditorState.createEmpty());
    setValidationErrors({});
    setSubmitError(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNumberChange = (event) => {
    const { name, value } = event.target;
    const numValue = parseInt(value, 10);
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: isNaN(numValue) ? 0 : numValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue
      }));
    }
  };

  const handleDateChange = (date, field) => {
    setFormData(prev => ({
      ...prev,
      validity: {
        ...prev.validity,
        [field]: date
      }
    }));
  };

  const handleVendorChange = (event) => {
    const vendorId = event.target.value;
    const selectedVendor = vendors.find(v => v.id === vendorId);
    
    setFormData(prev => ({
      ...prev,
      itemId: vendorId,
      vendorName: selectedVendor ? selectedVendor.name : ''
    }));
  };

  const handleDescriptionEditorChange = (editorState) => {
    setDescriptionEditorState(editorState);
    const htmlContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));
    setFormData(prev => ({
      ...prev,
      description: htmlContent
    }));
  };

  const handleTermsEditorChange = (editorState) => {
    setTermsEditorState(editorState);
    const htmlContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));
    setFormData(prev => ({
      ...prev,
      terms: htmlContent
    }));
  };

  const convertHtmlToEditorState = (html) => {
    if (!html) return EditorState.createEmpty();
    
    const contentBlock = htmlToDraft(html);
    const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
    return EditorState.createWithContent(contentState);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.itemId) {
      errors.itemId = 'Please select a vendor';
    }
    
    if (!formData.title) {
      errors.title = 'Deal title is required';
    }
    
    if (!formData.description) {
      errors.description = 'Deal description is required';
    }
    
    if (!formData.validity.startDate) {
      errors.startDate = 'Start date is required';
    }
    
    if (!formData.validity.endDate) {
      errors.endDate = 'End date is required';
    }
    
    if (formData.validity.startDate && formData.validity.endDate &&
        formData.validity.startDate > formData.validity.endDate) {
      errors.endDate = 'End date must be after start date';
    }
    
    if (!formData.limits.maxClaims || formData.limits.maxClaims <= 0) {
      errors.maxClaims = 'Maximum claims must be greater than 0';
    }
    
    if (!formData.limits.perUserLimit || formData.limits.perUserLimit <= 0) {
      errors.perUserLimit = 'Per user limit must be greater than 0';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      // Prepare analytics data
      const analyticsData = {
        ...formData.analytics,
        totalAvailable: formData.limits.maxClaims,
        currentlyClaimed: formData.analytics?.currentlyClaimed || 0
      };
      
      const dealData = {
        ...formData,
        analytics: analyticsData,
        status: {
          ...formData.status,
          isActive: true
        }
      };
      
      if (isEditing) {
        await updateDeal(dealId, dealData);
      } else {
        await addDeal(dealData);
      }
      
      if (onSubmissionSuccess) {
        onSubmissionSuccess();
      }
    } catch (err) {
      console.error('Error saving deal:', err);
      setSubmitError(`Failed to ${isEditing ? 'update' : 'create'} deal. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingVendors) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {fetchError}
      </Alert>
    );
  }

  return (
    <Paper className="deal-form-container">
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Vendor Selection */}
          <Grid item xs={12}>
            <FormControl 
              fullWidth 
              error={!!validationErrors.itemId}
              disabled={isEditing}
            >
              <InputLabel id="vendor-select-label">Vendor</InputLabel>
              <MuiSelect
                labelId="vendor-select-label"
                id="vendor-select"
                name="itemId"
                value={formData.itemId}
                onChange={handleVendorChange}
                label="Vendor"
              >
                {vendors.map(vendor => (
                  <MenuItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </MenuItem>
                ))}
              </MuiSelect>
              {validationErrors.itemId && (
                <FormHelperText>{validationErrors.itemId}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Deal Title */}
          <Grid item xs={12}>
            <TextField
              label="Deal Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              fullWidth
              required
              error={!!validationErrors.title}
              helperText={validationErrors.title}
            />
          </Grid>

          {/* Deal Description */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Deal Description
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 1, 
                border: validationErrors.description ? '1px solid red' : '1px solid rgba(0, 0, 0, 0.23)' 
              }}
            >
              <Editor
                editorState={descriptionEditorState}
                onEditorStateChange={handleDescriptionEditorChange}
                wrapperClassName="editor-wrapper"
                editorClassName="editor-main"
                toolbar={{
                  options: ['inline', 'blockType', 'list', 'textAlign', 'link', 'emoji', 'remove', 'history'],
                }}
              />
            </Paper>
            {validationErrors.description && (
              <FormHelperText error>{validationErrors.description}</FormHelperText>
            )}
          </Grid>

          {/* Deal Terms and Conditions */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Terms and Conditions
            </Typography>
            <Paper variant="outlined" sx={{ p: 1 }}>
              <Editor
                editorState={termsEditorState}
                onEditorStateChange={handleTermsEditorChange}
                wrapperClassName="editor-wrapper"
                editorClassName="editor-main"
                toolbar={{
                  options: ['inline', 'blockType', 'list', 'textAlign', 'link', 'emoji', 'remove', 'history'],
                }}
              />
            </Paper>
          </Grid>

          {/* Validity Period */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>Start Date</Typography>
            <DatePicker
              selected={formData.validity.startDate}
              onChange={(date) => handleDateChange(date, 'startDate')}
              dateFormat="MM/dd/yyyy"
              isClearable={true}
              placeholderText="Select start date"
              className="form-control date-picker"
              wrapperClassName="date-picker-wrapper"
            />
            {validationErrors.startDate && (
              <FormHelperText error>{validationErrors.startDate}</FormHelperText>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>End Date</Typography>
            <DatePicker
              selected={formData.validity.endDate}
              onChange={(date) => handleDateChange(date, 'endDate')}
              dateFormat="MM/dd/yyyy"
              isClearable={true}
              placeholderText="Select end date"
              className="form-control date-picker"
              wrapperClassName="date-picker-wrapper"
              minDate={formData.validity.startDate}
            />
            {validationErrors.endDate && (
              <FormHelperText error>{validationErrors.endDate}</FormHelperText>
            )}
          </Grid>

          {/* Claim Limits */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Maximum Claims"
              name="limits.maxClaims"
              type="number"
              value={formData.limits.maxClaims}
              onChange={handleNumberChange}
              fullWidth
              InputProps={{ inputProps: { min: 1 } }}
              error={!!validationErrors.maxClaims}
              helperText={validationErrors.maxClaims}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Claims Per User"
              name="limits.perUserLimit"
              type="number"
              value={formData.limits.perUserLimit}
              onChange={handleNumberChange}
              fullWidth
              InputProps={{ inputProps: { min: 1 } }}
              error={!!validationErrors.perUserLimit}
              helperText={validationErrors.perUserLimit}
            />
          </Grid>

          {/* Error Messages */}
          {submitError && (
            <Grid item xs={12}>
              <Alert severity="error">{submitError}</Alert>
            </Grid>
          )}

          {/* Form Actions */}
          <Grid item xs={12} className="form-actions">
            <Button 
              variant="outlined" 
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <CircularProgress size={24} thickness={4} sx={{ mr: 1 }} />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Deal' : 'Create Deal'
              )}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

DealForm.propTypes = {
  dealId: PropTypes.string,
  onSubmissionSuccess: PropTypes.func,
  onCancel: PropTypes.func,
};

export default DealForm; 