import React, { useState } from 'react';
import { shareVideo } from '../utils/api';

interface ShareButtonProps {
  videoId: string;
  title: string;
}

/**
 * A sharing button that leverages native sharing or falls back to copy-to-clipboard.
 */
export function ShareButton({ videoId, title }: ShareButtonProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const reportShare = async (platform: string) => {
    try {
      await shareVideo(videoId, platform);
    } catch (err) {
      console.warn('Failed to log share event in backend:', err);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSharing) return;

    setIsSharing(true);
    const shareUrl = `${window.location.origin}${window.location.pathname}?videoId=${videoId}`;

    // 1. Try native navigator.share if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: `DripTrip - ${title}`,
          text: `Check out "${title}" on DripTrip!`,
          url: shareUrl,
        });
        
        // Log share in backend
        await reportShare('native');
        
        setToastMessage('Shared successfully!');
        setTimeout(() => setToastMessage(null), 3000);
      } catch (err) {
        // user cancelled or share failed, log error but don't show toast
        console.warn('Native share failed or dismissed:', err);
      } finally {
        setIsSharing(false);
      }
    } else {
      // 2. Fallback to copy link to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        
        // Log share in backend
        await reportShare('clipboard');

        setToastMessage('Link copied to clipboard! 📋');
        setTimeout(() => setToastMessage(null), 3000);
      } catch (err) {
        console.error('Clipboard copy failed:', err);
        setToastMessage('Failed to copy link. Please copy manually.');
        setTimeout(() => setToastMessage(null), 3000);
      } finally {
        setIsSharing(false);
      }
    }
  };

  return (
    <div className="share-button-container">
      {toastMessage && (
        <div className="share-toast">
          {toastMessage}
        </div>
      )}

      <button
        type="button"
        className="share-btn"
        onClick={handleShare}
        disabled={isSharing}
        aria-label="Share video"
      >
        <svg
          className="share-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span className="share-label">Share</span>
      </button>
    </div>
  );
}
