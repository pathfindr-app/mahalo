import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
  Divider,
  Link,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import { getItem } from '../../services/firestoreService';
import { queryDeals } from '../../services/firestoreService';
import './ItemDetailModal.css';

const DetailBlock = ({ title, children, className = "" }) => (
    <Box className={`content-block ${className}`}>
        <Box className="content-block-inner">
            <Typography variant="h6" gutterBottom>{title}</Typography>
            <Divider sx={{ mb: 1 }} />
            {children}
        </Box>
    </Box>
);

const DescriptionBlock = ({ item }) => (
    <DetailBlock title="Details">
        {item.description?.detailed ? (
            <div
                className="item-detailed-description"
                dangerouslySetInnerHTML={{ __html: item.description.detailed }}
            />
        ) : <Typography variant="body2" color="textSecondary">No detailed description available.</Typography>}
    </DetailBlock>
);

const GalleryBlock = ({ item }) => (
    <DetailBlock title="Gallery">
        <Box className="item-gallery">
            <div className="gallery-grid">
                {item.presentation.gallery.map((image, index) => (
                    <div className="gallery-item" key={index}>
                        <img src={image.url} alt={image.alt || `Gallery image ${index + 1}`} />
                    </div>
                ))}
            </div>
        </Box>
    </DetailBlock>
);

const LocationBlock = ({ item, getDirectionsUrl }) => (
    <DetailBlock title="Location">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LocationOnIcon sx={{ mr: 1 }} fontSize="small" />
            <Typography variant="body2">
                Lat: {item.location.coordinates.lat.toFixed(5)}, Lng: {item.location.coordinates.lng.toFixed(5)}
            </Typography>
        </Box>
        <Link
            href={getDirectionsUrl(item.location.coordinates.lat, item.location.coordinates.lng)}
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
        >
            Get Directions
        </Link>
    </DetailBlock>
);

const ParkingBlock = ({ item, getDirectionsUrl }) => (
    <DetailBlock title="Parking">
        {item.location?.parking?.availability && item.location.parking.availability !== 'none' && (
            <Chip
                icon={<LocalParkingIcon />}
                label={item.location.parking.availability.charAt(0).toUpperCase() + item.location.parking.availability.slice(1)}
                size="small"
                color={item.location.parking.availability === 'ample' ? 'success' : item.location.parking.availability === 'limited' ? 'warning' : 'default'}
                sx={{ mb: 1 }}
            />
        )}
        {item.location?.parking?.description && (
            <Typography variant="body2" sx={{ mb: 1 }}>{item.location.parking.description}</Typography>
        )}
        {item.location?.parking?.cost && (
            <Typography variant="body2" sx={{ mb: 1 }}>Cost: {item.location.parking.cost}</Typography>
        )}
        {item.location?.parking?.coordinates?.lat && (
            <Link
                href={getDirectionsUrl(item.location.parking.coordinates.lat, item.location.parking.coordinates.lng)}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
            >
                Directions to Parking
            </Link>
        )}
        {item.location?.parking?.availability === 'none' && !item.location?.parking?.description && !item.location?.parking?.cost && (
           <Typography variant="body2" color="textSecondary">No specific parking information available.</Typography>
        )}
    </DetailBlock>
);

// Helper function to format dates - Now handles Firestore Timestamps
const formatDate = (timestampOrDateString) => {
  if (!timestampOrDateString) return 'N/A';
  try {
    let date;
    // Check if it looks like a Firestore Timestamp object
    if (timestampOrDateString && typeof timestampOrDateString.seconds === 'number' && typeof timestampOrDateString.nanoseconds === 'number') {
      date = timestampOrDateString.toDate(); // Convert Firestore Timestamp to JS Date
    } else {
      date = new Date(timestampOrDateString); // Assume it's a string or already a Date
    }

    if (isNaN(date.getTime())) { // Check if date is invalid
        return 'Invalid Date';
    }

    // Adjust options as needed
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    console.error("Error formatting date:", timestampOrDateString, e);
    return 'Error'; // Return generic error on failure
  }
};

const DealsBlock = ({ deals }) => {
    return (
        <DetailBlock title="Current Deals">
            <Box className="item-deals">
                {deals.length > 0 ? deals.map((deal) => {
                    return (
                        <Box key={deal.id} className="deal-item" sx={{ mb: 2, pb: 1, borderBottom: '1px solid #eee' }}>
                            <Typography variant="body1" fontWeight="bold" gutterBottom>{deal.title}</Typography>
                            <Typography
                                variant="body2"
                                component="div"
                                dangerouslySetInnerHTML={{ __html: deal.description }}
                                sx={{ mb: 1 }}
                            />
                            {(deal.validity?.startDate || deal.validity?.endDate) && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                    <Typography variant="caption" color="textSecondary">
                                        Valid: {formatDate(deal.validity?.startDate)} - {formatDate(deal.validity?.endDate)}
                                    </Typography>
                                </Box>
                            )}
                            {(typeof deal.analytics?.currentlyClaimed !== 'undefined' && deal.limits?.maxClaims) && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <ConfirmationNumberIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                    <Typography variant="caption" color="textSecondary">
                                        Claims: {deal.analytics?.currentlyClaimed} / {deal.limits?.maxClaims}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    );
                }) : (
                    <Typography variant="body2" color="textSecondary">No active deals available.</Typography>
                )}
            </Box>
        </DetailBlock>
    );
};

const TagsBlock = ({ item }) => (
     <DetailBlock title="Tags">
         <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
             {item.tags.map((tag, index) => (
                 <Chip key={index} label={tag} size="small" />
             ))}
         </Box>
     </DetailBlock>
);

const BestTimeBlock = ({ item }) => (
     <DetailBlock title="Best Time to Visit">
         <Typography variant="body2">{item.description.bestTime}</Typography>
     </DetailBlock>
);

const WeatherNotesBlock = ({ item }) => (
     <DetailBlock title="Weather Notes">
         <Typography variant="body2">{item.description.weatherNotes}</Typography>
     </DetailBlock>
);

const ItemDetailModal = ({ isOpen, onClose, itemId }) => {
  const [item, setItem] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !itemId) return;

    const fetchItemData = async () => {
      setLoading(true);
      setError(null);

      try {
        const itemData = await getItem(itemId);
        setItem(itemData);

        if (itemData && itemData.type === 'vendor') {
          const dealsData = await queryDeals({ itemId: itemId, activeOnly: true });
          setDeals(dealsData);
        } else {
          setDeals([]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching item data or deals:', err);
        setError('Failed to load item details or deals. Please try again.');
        setLoading(false);
      }
    };

    fetchItemData();
  }, [isOpen, itemId]);

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '95%', sm: '85%', md: '75%' },
    maxWidth: '1000px',
    maxHeight: '90vh',
    bgcolor: 'background.paper',
    boxShadow: 24,
    borderRadius: 2,
    p: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  };

  const getDirectionsUrl = (lat, lng) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  const renderContent = () => {
    if (loading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}><CircularProgress /></Box>;
    }
    if (error) {
      return <Typography color="error" sx={{ p: 3 }}>{error}</Typography>;
    }
    if (!item) {
      return <Typography sx={{ p: 3 }}>No item data found.</Typography>;
    }

    const showDescription = !!item.description?.detailed;
    const showGallery = item.presentation?.gallery?.length > 0;
    const showLocation = !!item.location?.coordinates;
    const showParking = item.location?.parking?.availability || item.location?.parking?.description || item.location?.parking?.cost;
    const showDeals = item.type === 'vendor' && deals.length > 0;
    const showTags = item.tags && item.tags.length > 0;
    const showBestTime = !!item.description?.bestTime;
    const showWeatherNotes = !!item.description?.weatherNotes;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
             <Box className="item-detail-header">
                {item.presentation?.headerImage?.url && (
                    <Box
                        className="item-detail-header-image"
                        sx={{ backgroundImage: `url(${item.presentation.headerImage.url})` }}
                    />
                )}
                <Box className="item-detail-header-content">
                    <Typography variant="h5" component="h2" className="item-title">
                        {item.name}
                    </Typography>
                    {item.description?.brief && (
                        <Typography variant="body1" className="item-brief">
                            {item.description.brief}
                        </Typography>
                    )}
                </Box>
                <IconButton onClick={onClose} className="close-button" size="small">
                    <CloseIcon />
                </IconButton>
             </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, backgroundColor: '#f4f4f4' }}>
                 <Grid container spacing={2}>
                    {showDescription && (
                        <Grid item xs={12} md={showGallery ? 7 : 12}>
                            <DescriptionBlock item={item} />
                        </Grid>
                    )}
                     {showGallery && (
                        <Grid item xs={12} md={showDescription ? 5 : 12}>
                            <GalleryBlock item={item} />
                        </Grid>
                    )}

                    {showLocation && (
                        <Grid item xs={12} sm={6} md={4}>
                            <LocationBlock item={item} getDirectionsUrl={getDirectionsUrl} />
                        </Grid>
                    )}
                    {showParking && (
                         <Grid item xs={12} sm={6} md={4}>
                            <ParkingBlock item={item} getDirectionsUrl={getDirectionsUrl}/>
                         </Grid>
                    )}
                    {showDeals && (
                        <Grid item xs={12} sm={6} md={4}>
                            <DealsBlock deals={deals} />
                        </Grid>
                    )}

                     {showBestTime && (
                        <Grid item xs={12} sm={6}>
                            <BestTimeBlock item={item} />
                        </Grid>
                     )}
                     {showWeatherNotes && (
                        <Grid item xs={12} sm={6}>
                            <WeatherNotesBlock item={item} />
                        </Grid>
                     )}

                    {showTags && (
                        <Grid item xs={12}>
                            <TagsBlock item={item} />
                        </Grid>
                    )}

                 </Grid>
             </Box>
        </Box>
    );
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="item-detail-title"
      aria-describedby="item-detail-description"
    >
      <Box sx={modalStyle}>
         {renderContent()}
      </Box>
    </Modal>
  );
};

export default ItemDetailModal; 