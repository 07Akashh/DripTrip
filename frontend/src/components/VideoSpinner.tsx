interface VideoSpinnerProps {
  isLoading: boolean;
}

/**
 * A beautiful loading spinner overlay for the video player.
 * Shows an animated spinner when isLoading is true.
 */
export function VideoSpinner({ isLoading }: VideoSpinnerProps) {
  if (!isLoading) return null;

  return (
    <div className="video-spinner-overlay">
      <div className="spinner-container">
        <div className="spinner-ring"></div>
        <span className="spinner-text">Loading Media...</span>
      </div>
    </div>
  );
}
