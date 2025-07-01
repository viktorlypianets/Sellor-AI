import React, { useState, useEffect } from 'react';
import './Avatar.css';

const Avatar = ({ videoUrl, isVisible, onVideoEnd }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (videoUrl && isVisible) {
      setIsLoading(true);
      setError(null);
    }
  }, [videoUrl, isVisible]);

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setError('Failed to load video');
  };

  const handleVideoEnd = () => {
    if (onVideoEnd) {
      onVideoEnd();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="avatar-container">
      {isLoading && (
        <div className="avatar-loading">
          <div className="loading-spinner"></div>
          <p>Generating avatar...</p>
        </div>
      )}

      {error && (
        <div className="avatar-error">
          <p>{error}</p>
        </div>
      )}

      {videoUrl && !error && (
        <video
          className="avatar-video"
          src={videoUrl}
          autoPlay
          muted
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          onEnded={handleVideoEnd}
          playsInline
        />
      )}

      {!videoUrl && !isLoading && !error && (
        <div className="avatar-placeholder">
          <div className="avatar-icon">👤</div>
        </div>
      )}
    </div>
  );
};

export default Avatar; 