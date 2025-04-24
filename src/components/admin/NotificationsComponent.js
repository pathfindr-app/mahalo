import React, { useState, useEffect } from 'react';
import { getAdminNotifications, markNotificationAsRead } from '../../services/cloudFunctionsService';
import './NotificationsComponent.css';

/**
 * Component for displaying admin notifications from Firebase
 * Shows notifications about deals approaching expiration or max claims
 */
const NotificationsComponent = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const notificationsData = await getAdminNotifications();
        setNotifications(notificationsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Set up polling every 5 minutes (300000ms)
    const intervalId = setInterval(fetchNotifications, 300000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      // Remove from local state
      setNotifications(notifications.filter(note => note.id !== notificationId));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to update notification. Please try again.');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid date';
    }
  };

  const renderNotificationContent = (notification) => {
    switch (notification.type) {
      case 'deal_expiration':
        return (
          <>
            <h4>Deal Expiring Soon</h4>
            <p>
              <strong>{notification.dealTitle}</strong> will expire on {formatDate(notification.expirationTime)}.
            </p>
          </>
        );
        
      case 'deal_claims_limit':
        return (
          <>
            <h4>Deal Claims Limit Approaching</h4>
            <p>
              <strong>{notification.dealTitle}</strong> has reached {notification.claimsPercentage.toFixed(0)}% 
              of maximum claims ({notification.currentClaims} of {notification.maxClaims}).
            </p>
          </>
        );
        
      default:
        return (
          <>
            <h4>Notification</h4>
            <p>You have a new notification.</p>
          </>
        );
    }
  };

  if (loading) {
    return <div className="notifications-loading">Loading notifications...</div>;
  }

  if (error) {
    return <div className="notifications-error">{error}</div>;
  }

  if (notifications.length === 0) {
    return <div className="notifications-empty">No new notifications</div>;
  }

  return (
    <div className="notifications-container">
      <h3 className="notifications-title">
        Notifications ({notifications.length})
      </h3>
      
      <div className="notifications-list">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`notification-item priority-${notification.priority || 'normal'}`}
          >
            <div className="notification-content">
              {renderNotificationContent(notification)}
              <div className="notification-meta">
                <span className="notification-time">
                  {formatDate(notification.created)}
                </span>
              </div>
            </div>
            <button 
              className="notification-action"
              onClick={() => handleMarkAsRead(notification.id)}
            >
              Mark as read
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsComponent; 