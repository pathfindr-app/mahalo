import React from 'react';
import { useParams } from 'react-router-dom';

function DetailPage() {
  const { id } = useParams();
  
  return (
    <div className="detail-page">
      <h1>Location Details</h1>
      <p>Viewing details for location: {id}</p>
      {/* Detail content will go here */}
    </div>
  );
}

export default DetailPage; 