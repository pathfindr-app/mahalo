import React, { useState, useEffect } from 'react';
import { getDealAnalytics, generateWeeklyReport } from '../../services/cloudFunctionsService';
import './DealAnalytics.css';

/**
 * Component for displaying deal analytics
 */
const DealAnalytics = ({ dealId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!dealId) return;
      
      try {
        setLoading(true);
        const data = await getDealAnalytics(dealId);
        setAnalytics(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching deal analytics:', err);
        setError('Failed to load analytics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dealId]);

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      setReportMessage(null);
      
      const reportResult = await generateWeeklyReport();
      
      if (reportResult.success) {
        setReportMessage({
          type: 'success',
          text: 'Weekly report generated successfully!'
        });
      } else {
        throw new Error('Report generation failed');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setReportMessage({
        type: 'error',
        text: 'Failed to generate weekly report. Please try again.'
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  // Helper to format percentage
  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics data...</div>;
  }

  if (error) {
    return <div className="analytics-error">{error}</div>;
  }

  if (!analytics) {
    return <div className="analytics-empty">No analytics data available</div>;
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h3>Deal Analytics</h3>
        <button 
          className="generate-report-btn"
          onClick={handleGenerateReport}
          disabled={generatingReport}
        >
          {generatingReport ? 'Generating...' : 'Generate Weekly Report'}
        </button>
      </div>
      
      {reportMessage && (
        <div className={`report-message ${reportMessage.type}`}>
          {reportMessage.text}
        </div>
      )}
      
      <div className="analytics-summary">
        <div className="analytics-card">
          <div className="analytics-value">{analytics.currentlyClaimed}</div>
          <div className="analytics-label">Claims</div>
        </div>
        
        <div className="analytics-card">
          <div className="analytics-value">{analytics.totalAvailable}</div>
          <div className="analytics-label">Total Available</div>
        </div>
        
        <div className="analytics-card">
          <div className="analytics-value">{formatPercentage(analytics.claimRate)}</div>
          <div className="analytics-label">Claim Rate</div>
        </div>
        
        <div className="analytics-card">
          <div className="analytics-value">
            {analytics.isActive ? (
              <span className="status-active">Active</span>
            ) : (
              <span className="status-inactive">Inactive</span>
            )}
          </div>
          <div className="analytics-label">Status</div>
        </div>
      </div>
      
      {analytics.peakTimes && analytics.peakTimes.length > 0 && (
        <div className="peak-times-section">
          <h4>Peak Claim Times</h4>
          <div className="peak-times-container">
            {analytics.peakTimes
              .sort((a, b) => b.claimCount - a.claimCount)
              .slice(0, 5)
              .map((peak, index) => {
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return (
                  <div key={index} className="peak-time-item">
                    <div className="peak-day-time">
                      {dayNames[peak.dayOfWeek]} at {peak.timeOfDay}
                    </div>
                    <div className="peak-count">
                      {peak.claimCount} {peak.claimCount === 1 ? 'claim' : 'claims'}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DealAnalytics; 