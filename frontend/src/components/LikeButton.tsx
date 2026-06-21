import React, { useState } from 'react';
import { getPersistentDeviceId } from '../utils/device';
import { likeVideo } from '../utils/api';

interface LikeButtonProps {
  videoId: string;
  initialLikes: number;
  initialIsLiked: boolean;
  onLikeToggle?: (isLiked: boolean, likesCount: number) => void;
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
}


/**
 * A like button component featuring optimistic toggles (like & unlike)
 * and persistent client tracking.
 */
export function LikeButton({ videoId, initialLikes, initialIsLiked, onLikeToggle }: LikeButtonProps) {
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [prevInitialLikes, setPrevInitialLikes] = useState(initialLikes);
  const [prevInitialIsLiked, setPrevInitialIsLiked] = useState(initialIsLiked);

  // Sync state if props change directly during rendering (avoids cascading render warning)
  if (initialLikes !== prevInitialLikes || initialIsLiked !== prevInitialIsLiked) {
    setPrevInitialLikes(initialLikes);
    setPrevInitialIsLiked(initialIsLiked);
    setLikesCount(initialLikes);
    setIsLiked(initialIsLiked);
  }

  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const spawnHearts = () => {
    const newHearts = Array.from({ length: 5 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 40,
      y: -20 - Math.random() * 30,
    }));
    
    setFloatingHearts((prev) => [...prev, ...newHearts]);

    setTimeout(() => {
      setFloatingHearts((prev) =>
        prev.filter((h) => !newHearts.some((nh) => nh.id === h.id))
      );
    }, 1000);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const deviceId = getPersistentDeviceId();
    const previousLikes = likesCount;
    const previousIsLiked = isLiked;

    // Optimistic Update: toggle state
    const nextIsLiked = !previousIsLiked;
    const nextLikes = nextIsLiked ? previousLikes + 1 : Math.max(0, previousLikes - 1);

    setLikesCount(nextLikes);
    setIsLiked(nextIsLiked);
    setErrorMsg(null);

    // Sync parent state immediately (optimistic)
    if (onLikeToggle) {
      onLikeToggle(nextIsLiked, nextLikes);
    }

    // Spawn hearts only on liking
    if (nextIsLiked) {
      spawnHearts();
    }

    try {
      const data = await likeVideo(videoId, deviceId);
      if (data && typeof data.likes === 'number') {
        // Sync to exact server count
        setLikesCount(data.likes);
        if (typeof data.isLiked === 'boolean') {
          setIsLiked(data.isLiked);
          if (onLikeToggle) {
            onLikeToggle(data.isLiked, data.likes);
          }
        }
      }
    } catch (error) {
      console.warn('Optimistic update failed. Reverting like state:', error);
      
      // Rollback UI to previous states
      setLikesCount(previousLikes);
      setIsLiked(previousIsLiked);
      if (onLikeToggle) {
        onLikeToggle(previousIsLiked, previousLikes);
      }
      setErrorMsg('Failed to sync. Connection lost.');
      
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  return (
    <div className="like-button-container">
      {errorMsg && (
        <div className="like-error-toast">
          ⚠️ {errorMsg}
        </div>
      )}

      <button
        type="button"
        className={`like-btn ${isLiked ? 'active' : ''}`}
        onClick={handleLike}
        aria-label={isLiked ? "Unlike video" : "Like video"}
      >
        <svg
          className="heart-icon"
          viewBox="0 0 24 24"
          fill={isLiked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span className="likes-count">{likesCount}</span>

        {/* Floating heart burst particles */}
        {floatingHearts.map((heart) => (
          <span
            key={heart.id}
            className="floating-heart"
            style={{
              transform: `translate(${heart.x}px, ${heart.y}px)`,
            }}
          >
            ❤️
          </span>
        ))}
      </button>
    </div>
  );
}
