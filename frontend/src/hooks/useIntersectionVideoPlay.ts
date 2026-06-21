import { useEffect, useRef } from 'react';

interface UseIntersectionVideoPlayOptions {
  /**
   * The visibility ratio threshold at which the video should start playing.
   * Defaults to 0.6 (60% visible).
   */
  threshold?: number;
  /**
   * The element that is used as the viewport for checking visibility of the target.
   * Defaults to the browser viewport (null).
   */
  root?: Element | Document | null;
  /**
   * Margin around the root.
   * Defaults to '0px'.
   */
  rootMargin?: string;
}

/**
 * A custom React hook that automatically plays a video when it is at least
 * 60% visible in the viewport, and pauses it when it moves out of view.
 * 
 * @param options Configuration options for the IntersectionObserver
 * @returns A mutable ref object to be attached to the <video> element
 */
export function useIntersectionVideoPlay(options?: UseIntersectionVideoPlayOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const threshold = options?.threshold ?? 0.6;
  const root = options?.root ?? null;
  const rootMargin = options?.rootMargin ?? '0px';

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // We observe with the specified threshold.
    // When the element crosses the threshold boundary, the callback fires.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          videoElement.play().catch((error) => {
            // Browsers block autoplay for unmuted videos without user interaction.
            // Catch and log the warning to prevent uncaught runtime errors.
            console.warn(
              'useIntersectionVideoPlay: Video playback failed. Ensure the video is muted or has user interaction permissions.',
              error
            );
          });
        } else {
          videoElement.pause();
        }
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    observer.observe(videoElement);

    return () => {
      observer.unobserve(videoElement);
      observer.disconnect();
    };
  }, [threshold, root, rootMargin]);

  return videoRef;
}
