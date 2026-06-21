/**
 * A beautiful minimalist skeleton loader overlay to replace spinners.
 * Renders shimmering placeholders for the video story layout.
 */
export function VideoSkeleton() {
  return (
    <div className="video-skeleton-overlay">
      <div className="skeleton-media skeleton-shimmer" />
      
      {/* Right Action Icons placeholders */}
      <div className="skeleton-actions">
        <div className="skeleton-circle skeleton-shimmer" />
        <div className="skeleton-circle skeleton-shimmer" />
      </div>

      {/* Bottom Caption placeholders */}
      <div className="skeleton-caption">
        <div className="skeleton-line skeleton-shimmer short" />
        <div className="skeleton-line skeleton-shimmer long" />
      </div>
    </div>
  );
}
