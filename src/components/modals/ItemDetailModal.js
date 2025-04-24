import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import InfoIcon from '@mui/icons-material/Info';
import ImageIcon from '@mui/icons-material/Image';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { getItem } from '../../services/firestoreService';
import { queryDeals } from '../../services/firestoreService';
import './ItemDetailModal.css';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      className="item-detail-tabpanel"
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ItemDetailModal = ({ isOpen, onClose, itemId }) => {
  const [item, setItem] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Fetch item data when modal opens and itemId changes
  useEffect(() => {
    if (!isOpen || !itemId) return;
    
    const fetchItemData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const itemData = await getItem(itemId);
        setItem(itemData);
        
        // If this is a vendor, fetch its deals
        if (itemData && itemData.type === 'vendor') {
          const dealsData = await queryDeals({ itemId: itemId, activeOnly: true });
          setDeals(dealsData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching item data:', err);
        setError('Failed to load item details. Please try again.');
        setLoading(false);
      }
    };
    
    fetchItemData();
  }, [isOpen, itemId]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '95%', sm: '80%', md: '70%' },
    maxWidth: '900px',
    maxHeight: '90vh',
    bgcolor: 'background.paper',
    boxShadow: 24,
    borderRadius: 2,
    p: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  };
  
  // Helper function to create Google Maps directions URL
  const getDirectionsUrl = (lat, lng) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="item-detail-modal-title"
    >
      <Box sx={modalStyle}>
        {/* Header with background image */}
        <Box className="item-detail-header">
          {item?.presentation?.headerImage?.url && (
            <div 
              className="item-detail-header-image"
              style={{ backgroundImage: `url(${item.presentation.headerImage.url})` }}
            />
          )}
          <Box className="item-detail-header-content">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography id="item-detail-modal-title" variant="h5" component="h2" className="item-title">
                {loading ? 'Loading...' : item?.name || 'Item Details'}
                {item?.type && (
                  <Chip 
                    label={item.type.toUpperCase()} 
                    size="small" 
                    color={item.type === 'vendor' ? 'primary' : 'secondary'} 
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
              <IconButton 
                aria-label="close" 
                onClick={onClose} 
                sx={{ color: 'white' }}
                className="close-button"
              >
                <CloseIcon />
              </IconButton>
            </Box>
            {item?.description?.brief && (
              <Typography variant="subtitle1" className="item-brief">
                {item.description.brief}
              </Typography>
            )}
          </Box>
        </Box>
        
        {/* Loading state */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {/* Error state */}
        {error && (
          <Box sx={{ p: 2 }}>
            <Typography color="error">{error}</Typography>
            <Button onClick={onClose} sx={{ mt: 2 }}>Close</Button>
          </Box>
        )}
        
        {/* Content */}
        {!loading && !error && item && (
          <>
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="item detail tabs"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab icon={<InfoIcon />} label="Details" />
                {item.presentation?.gallery?.length > 0 && (
                  <Tab icon={<ImageIcon />} label="Gallery" />
                )}
                <Tab icon={<LocationOnIcon />} label="Location" />
                {item.type === 'vendor' && deals.length > 0 && (
                  <Tab icon={<LocalOfferIcon />} label="Deals" />
                )}
              </Tabs>
            </Box>
            
            {/* Details Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box className="item-detail-content">
                {item.description?.detailed && (
                  <div 
                    className="item-detailed-description"
                    dangerouslySetInnerHTML={{ __html: item.description.detailed }}
                  />
                )}
                
                {item.tags && item.tags.length > 0 && (
                  <Box className="item-tags" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Tags:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {item.tags.map(tag => (
                        <Chip 
                          key={tag} 
                          label={tag.replace(/-/g, ' ')} 
                          size="small" 
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {item.description?.bestTime && (
                  <Box className="item-best-time" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Best Time to Visit:</Typography>
                    <Typography variant="body2">{item.description.bestTime}</Typography>
                  </Box>
                )}
                
                {item.description?.weatherNotes && (
                  <Box className="item-weather-notes" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Weather Considerations:</Typography>
                    <Typography variant="body2">{item.description.weatherNotes}</Typography>
                  </Box>
                )}
              </Box>
            </TabPanel>
            
            {/* Gallery Tab */}
            {item.presentation?.gallery?.length > 0 && (
              <TabPanel value={tabValue} index={1}>
                <Box className="item-gallery">
                  <div className="gallery-grid">
                    {item.presentation.gallery.map((image, index) => (
                      <div className="gallery-item" key={index}>
                        <img src={image.url} alt={image.alt || `Gallery image ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                </Box>
              </TabPanel>
            )}
            
            {/* Location Tab */}
            <TabPanel value={tabValue} index={2}>
              <Box className="item-location">
                {item.location?.coordinates && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">
                      <LocationOnIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      Coordinates
                    </Typography>
                    <Typography variant="body2">
                      Latitude: {item.location.coordinates.lat}, Longitude: {item.location.coordinates.lng}
                    </Typography>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      sx={{ mt: 1 }}
                      component="a"
                      href={getDirectionsUrl(item.location.coordinates.lat, item.location.coordinates.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get Directions
                    </Button>
                  </Box>
                )}
                
                {item.location?.parking?.availability && item.location.parking.availability !== 'none' && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2">
                      <LocalParkingIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      Parking Information
                    </Typography>
                    <Typography variant="body2">
                      <strong>Availability:</strong> {item.location.parking.availability.charAt(0).toUpperCase() + item.location.parking.availability.slice(1)}
                    </Typography>
                    
                    {item.location.parking.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Description:</strong> {item.location.parking.description}
                      </Typography>
                    )}
                    
                    {item.location.parking.cost && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Cost:</strong> {item.location.parking.cost}
                      </Typography>
                    )}
                    
                    {item.location.parking.coordinates?.lat && item.location.parking.coordinates?.lng && (
                      <>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Parking Coordinates:</strong> {item.location.parking.coordinates.lat}, {item.location.parking.coordinates.lng}
                        </Typography>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          sx={{ mt: 1 }}
                          component="a"
                          href={getDirectionsUrl(item.location.parking.coordinates.lat, item.location.parking.coordinates.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Get Directions to Parking
                        </Button>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            </TabPanel>
            
            {/* Deals Tab */}
            {item.type === 'vendor' && deals.length > 0 && (
              <TabPanel value={tabValue} index={item.presentation?.gallery?.length > 0 ? 3 : 2}>
                <Box className="item-deals">
                  <Typography variant="h6" sx={{ mb: 2 }}>Available Deals</Typography>
                  
                  {deals.map((deal, index) => (
                    <Box key={deal.id} className="deal-item" sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" className="deal-title">
                        {deal.title}
                      </Typography>
                      
                      {deal.description && (
                        <div 
                          className="deal-description"
                          dangerouslySetInnerHTML={{ __html: deal.description }}
                        />
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Chip 
                          label={`${deal.analytics?.currentlyClaimed || 0}/${deal.limits?.maxClaims || 0} claimed`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        
                        {deal.validity?.startDate && deal.validity?.endDate && (
                          <Typography variant="caption">
                            Valid: {new Date(deal.validity.startDate.seconds * 1000).toLocaleDateString()} 
                            {' - '}
                            {new Date(deal.validity.endDate.seconds * 1000).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                      
                      <Button 
                        variant="contained" 
                        color="primary" 
                        size="small" 
                        sx={{ mt: 2 }}
                        disabled={
                          (deal.analytics?.currentlyClaimed >= deal.limits?.maxClaims) ||
                          (new Date() > new Date(deal.validity?.endDate?.seconds * 1000))
                        }
                      >
                        Claim Deal
                      </Button>
                      
                      {index < deals.length - 1 && <Divider sx={{ mt: 2 }} />}
                    </Box>
                  ))}
                </Box>
              </TabPanel>
            )}
          </>
        )}
      </Box>
    </Modal>
  );
};

export default ItemDetailModal; 