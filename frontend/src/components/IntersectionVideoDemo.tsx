import { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { VideoModalSlider } from './VideoModalSlider';
import { getCloudinaryGifUrl, getCloudinaryPosterUrl } from '../utils/cloudinary';
import { getPersistentDeviceId } from '../utils/device';
import { type Video, getVideos } from '../utils/api';

import 'swiper/css';
import 'swiper/css/navigation';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
}

function VideoCard({ video, onClick }: VideoCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  // Generate Cloudinary loop and poster URLs dynamically, falling back to direct URLs
  const gifUrl = getCloudinaryGifUrl(video.gifUrl || video.publicId);
  const posterUrl = getCloudinaryPosterUrl(video.thumbnail || video.publicId);

  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(cardElement);

    return () => {
      observer.unobserve(cardElement);
      observer.disconnect();
    };
  }, []);

  // Play/pause the loop video element programmatically based on intersection
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isIntersecting) {
      videoElement.play().catch((err) => {
        console.debug('Autoplay deferred:', err.message);
      });
    } else {
      videoElement.pause();
    }
  }, [isIntersecting]);

  return (
    <div ref={cardRef} className="outer-video-card" onClick={onClick}>
      <div className="outer-thumbnail-container">
        <video
          ref={videoRef}
          src={gifUrl}
          poster={posterUrl}
          className="outer-video-gif"
          loop
          muted
          playsInline
          preload="auto"
        />
      </div>
    </div>
  );
}

export function IntersectionVideoDemo() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const deviceId = getPersistentDeviceId();
        const data = await getVideos(deviceId);
        setVideos(data);

        // Retrieve deep-linked video from URL parameters
        const params = new URLSearchParams(window.location.search);
        const sharedVideoId = params.get('videoId');
        if (sharedVideoId) {
          const idx = data.findIndex((v: Video) => v.id === sharedVideoId);
          if (idx > -1) {
            setSelectedVideoIndex(idx);
            setIsModalOpen(true);
          }
        }
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Failed to connect to the video service. Please make sure the backend is active.');
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, []);

  // Keeps the parent state synchronized when liking/unliking inside the modal
  const handleLikeToggle = (videoId: string, isLiked: boolean, likesCount: number) => {
    setVideos((prevVideos) =>
      prevVideos.map((v) => (v.id === videoId ? { ...v, isLiked, likes: likesCount } : v))
    );
  };

  const openVideoModal = (index: number) => {
    setSelectedVideoIndex(index);
    setIsModalOpen(true);
    // Sync URL when the modal opens initially
    const video = videos[index];
    if (video) {
      window.history.replaceState(null, '', `?videoId=${video.id}`);
    }
  };

  const closeVideoModal = () => {
    setIsModalOpen(false);
    // Clear URL parameters when the modal closes
    window.history.replaceState(null, '', window.location.pathname);
  };

  return (
    <div className="demo-wrapper">
      <div className="demo-header">
        <span className="demo-tag">Socially Approved</span>
        <h2>Our Bestsellers</h2>
        <p className="demo-subtitle">
          See what our community has shared. Click on any video card below to watch the live clip.
        </p>
      </div>

      {loading && (
        <div className="outer-skeleton-row">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="outer-skeleton-card-wrapper">
              <div className="outer-video-card skeleton-shimmer" style={{ aspectRatio: '9/16', borderRadius: '16px' }} />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="feed-status error">
          <p>⚠️ {error}</p>
          <button 
            type="button" 
            onClick={() => window.location.reload()} 
            className="retry-btn"
          >
            Retry Connection
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="outer-slider-container">
          <Swiper
            modules={[Navigation]}
            navigation
            slidesPerView={Math.min(videos.length || 4, 4)}
            spaceBetween={20}
            centerInsufficientSlides={true}
            breakpoints={{
              320: {
                slidesPerView: Math.min(videos.length || 1.2, 1.2),
                spaceBetween: 10,
              },
              480: {
                slidesPerView: Math.min(videos.length || 2, 2),
                spaceBetween: 15,
              },
              768: {
                slidesPerView: Math.min(videos.length || 3, 3),
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: Math.min(videos.length || 4, 4),
                spaceBetween: 15,
              }
            }}
            className="outer-swiper"
          >
            {videos.map((video, idx) => (
              <SwiperSlide key={video.id}>
                <VideoCard
                  video={video}
                  onClick={() => openVideoModal(idx)}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* Inner Modal Video Story Slider - Rendered conditionally to avoid state-sync issues */}
      {isModalOpen && (
        <VideoModalSlider
          isOpen={isModalOpen}
          onClose={closeVideoModal}
          videos={videos}
          initialIndex={selectedVideoIndex}
          onLikeToggle={handleLikeToggle}
        />
      )}
    </div>
  );
}
