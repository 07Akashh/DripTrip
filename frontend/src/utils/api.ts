export interface Video {
  id: string;
  publicId?: string;
  title: string;
  description: string;
  videoUrl?: string;
  gifUrl?: string;
  thumbnail?: string;
  likes: number;
  isLiked?: boolean;
}

export interface LikeResponse {
  success: boolean;
  likes: number;
  isLiked: boolean;
}

export interface ShareResponse {
  success: boolean;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  video: Video;
}

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // In Vercel deployment, route requests to the backend service path prefix
      return '/_/backend';
    }
  }
  
  return 'http://localhost:5001';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Helper to handle fetch responses and raise errors appropriately
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API error: ${response.status} ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson && errorJson.error) {
        errorMessage = errorJson.error;
      }
    } catch {
      // Use fallback error message if response is not JSON
    }
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

/**
 * Fetch all videos, optionally including device ID to check isLiked status
 */
export async function getVideos(deviceId?: string): Promise<Video[]> {
  const url = deviceId 
    ? `${API_BASE_URL}/videos?deviceId=${encodeURIComponent(deviceId)}`
    : `${API_BASE_URL}/videos`;
  const response = await fetch(url);
  return handleResponse<Video[]>(response);
}

/**
 * Like or unlike a video
 */
export async function likeVideo(videoId: string, deviceId: string): Promise<LikeResponse> {
  const response = await fetch(`${API_BASE_URL}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ videoId, deviceId }),
  });
  return handleResponse<LikeResponse>(response);
}

/**
 * Log sharing a video on a platform
 */
export async function shareVideo(videoId: string, platform: string): Promise<ShareResponse> {
  const response = await fetch(`${API_BASE_URL}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ videoId, platform }),
  });
  return handleResponse<ShareResponse>(response);
}

/**
 * Upload a video file with title and optional description
 */
export async function uploadVideo(
  videoFile: File,
  title: string,
  description?: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('title', title);
  if (description) {
    formData.append('description', description);
  }

  const response = await fetch(`${API_BASE_URL}/videos/upload`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<UploadResponse>(response);
}
