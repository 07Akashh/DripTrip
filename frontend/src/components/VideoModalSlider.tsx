import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { VideoSkeleton } from './VideoSkeleton';
import { ProgressBar } from './ProgressBar';
import { LikeButton } from './LikeButton';
import { ShareButton } from './ShareButton';
import { getCloudinaryStreamUrl, getCloudinaryPosterUrl } from '../utils/cloudinary';
import type { Video } from '../utils/api';

import 'swiper/css';
import 'swiper/css/navigation';

function isVideoFile(url: string | undefined): boolean {
  if (!url) return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.avi');
}

interface ActiveVideoPlayerProps {
  video: Video;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onLikeToggle?: (isLiked: boolean, likesCount: number) => void;
}

function ActiveVideoPlayer({ video, isActive, isMuted, onToggleMute, onLikeToggle }: ActiveVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const streamUrl = getCloudinaryStreamUrl(video.videoUrl || video.publicId);
  const isVideoPoster = isVideoFile(video.thumbnail || video.publicId);
  const posterUrl = isVideoPoster ? '' : getCloudinaryPosterUrl(video.thumbnail || video.publicId);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  // Sync HTML5 video element muted state with the global prop
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  };

  const handleDurationChange = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setDuration(e.currentTarget.duration);
  };

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    console.warn('Video failed to load in modal:', streamUrl);
    setIsLoading(false); // Hide the skeleton on error so the card isn't stuck shimmering
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Autoplay or pause based on Swiper index activity
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isActive) {
      const timer = setTimeout(() => {
        videoElement.play().catch((error) => {
          console.warn('Autoplay prevented by browser permissions:', error);
        });
      }, 150);
      return () => clearTimeout(timer);
    } else {
      videoElement.pause();
    }
  }, [isActive]);

  // Click on video toggles play / pause
  const handleVideoClick = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play().catch((err) => {
        console.warn('Playback resume blocked:', err);
      });
    }
  };

  return (
    <div className="modal-video-card-inner">
      {/* Video Skeleton Placeholder instead of Spinner */}
      {isLoading && <VideoSkeleton />}

      <video
        ref={videoRef}
        src={streamUrl}
        poster={posterUrl || undefined}
        className="demo-video"
        loop
        muted={isMuted}
        playsInline
        preload="metadata"
        onClick={handleVideoClick}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onLoadedData={handleLoadedData}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onLoadStart={() => setIsLoading(true)}
        style={{ cursor: 'pointer' }}
      />

      {/* Top Status & Mute Controls Overlay */}
      <div className="status-overlay">
        <span className={`status-badge ${isPlaying ? 'playing' : 'paused'}`}>
          <span className="pulse-dot" />
          {isPlaying ? 'Playing' : 'Paused'}
        </span>
        <button
          type="button"
          onClick={onToggleMute}
          className="mute-btn-circle"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            /* Muted State - Render speaker-off with slash icon */
            <svg viewBox="0 0 24 24" className="mute-icon" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          ) : (
            /* Unmuted State - Render speaker-on with waves icon */
            <svg viewBox="0 0 24 24" className="mute-icon" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L8 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Bottom Seekbar Progress Bar */}
      <div className="progress-bar-container">
        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
        />
      </div>

      {/* Right Edge Actions (Like, Share) - Product Cart bag button removed */}
      <div className="modal-video-actions-overlay">
        <LikeButton
          videoId={video.id}
          initialLikes={video.likes}
          initialIsLiked={!!video.isLiked}
          onLikeToggle={onLikeToggle}
        />
        
        <ShareButton videoId={video.id} title={video.title} />
      </div>

      {/* Minimal Reels-like text caption (Bottom Left Overlay) */}
      <div className="modal-reels-caption">
        <h5>@{video.title.toLowerCase().replace(/\s+/g, '')}</h5>
        <p>{video.description}</p>
      </div>
    </div>
  );
}

interface ModalVideoCardProps {
  video: Video;
  isActive: boolean;
  isMounted: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onLikeToggle?: (isLiked: boolean, likesCount: number) => void;
}

function ModalVideoCard({ video, isActive, isMounted, isMuted, onToggleMute, onLikeToggle }: ModalVideoCardProps) {
  const isVideoPoster = isVideoFile(video.thumbnail || video.publicId);
  const posterUrl = isVideoPoster ? '' : getCloudinaryPosterUrl(video.thumbnail || video.publicId);

  if (!isMounted) {
    return (
      <div className="modal-video-card-inner placeholder">
        {isVideoPoster ? (
          <div className="demo-video-thumbnail-fallback">
            <span className="fallback-video-icon">🎥</span>
          </div>
        ) : (
          <img src={posterUrl} className="demo-video-thumbnail" alt={video.title} />
        )}
        <div className="thumbnail-overlay">
          <div className="play-icon-placeholder">▶</div>
        </div>
      </div>
    );
  }

  return (
    <ActiveVideoPlayer
      video={video}
      isActive={isActive}
      isMuted={isMuted}
      onToggleMute={onToggleMute}
      onLikeToggle={onLikeToggle}
    />
  );
}

interface VideoModalSliderProps {
  isOpen: boolean;
  onClose: () => void;
  videos: Video[];
  initialIndex: number;
  onLikeToggle?: (videoId: string, isLiked: boolean, likesCount: number) => void;
}

export function VideoModalSlider({ isOpen, onClose, videos, initialIndex, onLikeToggle }: VideoModalSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMutedGlobal, setIsMutedGlobal] = useState(true);

  if (!isOpen) return null;

  const toggleMuteGlobal = () => {
    setIsMutedGlobal((prev) => !prev);
  };

  return (
    <div className="video-modal-backdrop" onClick={onClose}>
      <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">✕</button>

        <Swiper
          modules={[Navigation]}
          navigation
          initialSlide={initialIndex}
          slidesPerView={3}
          centeredSlides
          spaceBetween={30}
          onSlideChange={(swiper) => {
            setCurrentIndex(swiper.activeIndex);
            const activeVideo = videos[swiper.activeIndex];
            if (activeVideo) {
              window.history.replaceState(null, '', `?videoId=${activeVideo.id}`);
            }
          }}
          breakpoints={{
            320: {
              slidesPerView: 1.2,
              spaceBetween: 15,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 25,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 30,
            }
          }}
          className="modal-swiper"
        >
          {videos.map((video, idx) => {
            const isMounted = idx >= currentIndex - 1 && idx <= currentIndex + 1;
            const isActive = idx === currentIndex;

            return (
              <SwiperSlide key={video.id}>
                <ModalVideoCard
                  video={video}
                  isActive={isActive}
                  isMounted={isMounted}
                  isMuted={isMutedGlobal}
                  onToggleMute={toggleMuteGlobal}
                  onLikeToggle={(isLiked, likes) => onLikeToggle?.(video.id, isLiked, likes)}
                />
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </div>
  );
}
