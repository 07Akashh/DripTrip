import { Cloudinary } from '@cloudinary/url-gen';
import { fill } from '@cloudinary/url-gen/actions/resize';

// Initialize the Cloudinary instance with the public 'demo' cloud
export const cld = new Cloudinary({
  cloud: {
    cloudName: 'demo'
  }
});

/**
 * Helper to check if a string is a full absolute URL
 */
function isUrl(input: string | undefined): boolean {
  if (!input) return false;
  return input.startsWith('http://') || input.startsWith('https://');
}

/**
 * Generates an optimized primary streaming URL for live playback in the modal slider.
 * Uses auto quality and format delivery, falling back to direct URLs.
 * 
 * @param publicId Cloudinary asset public ID or absolute URL
 */
export function getCloudinaryStreamUrl(publicId: string | undefined): string {
  if (!publicId) return '';
  if (isUrl(publicId)) {
    return publicId;
  }
  return cld.video(publicId)
    .quality('auto')
    .format('auto')
    .toURL();
}

/**
 * Generates an extremely compressed, silent, looped portrait video URL
 * to act as a high-efficiency GIF in the outer slider. Falls back to direct URLs.
 * 
 * @param publicId Cloudinary asset public ID or absolute URL
 */
export function getCloudinaryGifUrl(publicId: string | undefined): string {
  if (!publicId) return '';
  if (isUrl(publicId)) {
    return publicId;
  }
  const video = cld.video(publicId);
  video.resize(fill().width(300).height(533))
    .quality('auto:low')
    .format('auto');
  return video.toURL();
}

/**
 * Generates a crisp image poster of the first frame of the video. Falls back to direct URLs.
 * 
 * @param publicId Cloudinary asset public ID or absolute URL
 */
export function getCloudinaryPosterUrl(publicId: string | undefined): string {
  if (!publicId) return '';
  if (isUrl(publicId)) {
    return publicId;
  }
  const image = cld.image(publicId);
  image.resize(fill().width(300).height(533))
    .format('auto')
    .quality('auto')
    .setAssetType('video'); // Read first frame of the video
  return image.toURL();
}
