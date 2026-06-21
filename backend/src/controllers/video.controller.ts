import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { VideoModel } from '../models/video.model';

// Configure Cloudinary with optional API keys, falling back to 'demo'
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * GET /videos
 * Returns all videos from MongoDB, enriched with Cloudinary URLs and checks like status for a device.
 */
export async function getVideos(req: Request, res: Response): Promise<void> {
  try {
    const { deviceId } = req.query;
    const dbVideos = await VideoModel.find({}).sort({ _id: 1 });

    const enrichedVideos = dbVideos.map((video) => {
      let videoUrl = video.publicId;
      let gifUrl = video.publicId;
      let thumbnail = video.publicId;

      if (video.publicId.startsWith('http://') || video.publicId.startsWith('https://')) {
        // Direct URL fallback
        videoUrl = video.publicId;
        gifUrl = video.publicId;
        thumbnail = video.publicId;
      } else {
        // Cloudinary public ID
        videoUrl = cloudinary.url(video.publicId, {
          resource_type: 'video',
          quality: 'auto',
          fetch_format: 'auto',
          secure: true
        });

        // Loop boomerang video: optimized for mobile loads (200x356, 3s loop, quality auto:low, format mp4)
        gifUrl = cloudinary.url(video.publicId, {
          resource_type: 'video',
          transformation: [
            { width: 200, height: 356, crop: 'fill' },
            { effect: 'boomerang' },
            { duration: 3, start_offset: 0 },
            { quality: 'auto:low', fetch_format: 'mp4' }
          ],
          secure: true
        });

        // Thumbnail poster image
        thumbnail = cloudinary.url(video.publicId, {
          resource_type: 'video',
          transformation: [
            { width: 200, height: 356, crop: 'fill' },
            { page: 1, fetch_format: 'auto', quality: 'auto' }
          ],
          secure: true
        });
      }

      const isLiked = deviceId && video.likedBy ? video.likedBy.includes(deviceId as string) : false;

      return {
        id: video.id,
        publicId: video.publicId,
        title: video.title,
        description: video.description,
        likes: video.likes,
        isLiked,
        videoUrl,
        gifUrl,
        thumbnail
      };
    });

    res.status(200).json(enrichedVideos);
  } catch (error) {
    console.error('Failed to get videos from MongoDB:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /like
 * Body: { videoId, deviceId }
 * Toggles like state persistently in MongoDB
 */
export async function likeVideo(req: Request, res: Response): Promise<void> {
  try {
    const { videoId, deviceId } = req.body;
    if (!videoId || !deviceId) {
      res.status(400).json({ error: 'videoId and deviceId are required' });
      return;
    }

    const video = await VideoModel.findOne({ id: videoId });
    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    const deviceLikedIndex = video.likedBy.indexOf(deviceId);
    let isLikedNow = false;

    if (deviceLikedIndex > -1) {
      // Unlike: Remove device ID and decrement count
      video.likedBy.splice(deviceLikedIndex, 1);
      video.likes = Math.max(0, video.likes - 1);
      isLikedNow = false;
    } else {
      // Like: Add device ID and increment count
      video.likedBy.push(deviceId);
      video.likes += 1;
      isLikedNow = true;
    }

    await video.save();

    res.status(200).json({ success: true, likes: video.likes, isLiked: isLikedNow });
  } catch (error) {
    console.error('Failed to toggle like in MongoDB:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /share
 * Body: { videoId, platform }
 * Tracks video share events
 */
export async function shareVideo(req: Request, res: Response): Promise<void> {
  try {
    const { videoId, platform } = req.body;
    if (!videoId || !platform) {
      res.status(400).json({ error: 'videoId and platform are required' });
      return;
    }

    const videoExists = await VideoModel.exists({ id: videoId });
    if (!videoExists) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    console.log(`Video [${videoId}] shared to platform: [${platform}]`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to register video share:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /videos/upload
 * Handles video file upload to Cloudinary and creates a new video collection entry in MongoDB.
 */
export async function uploadVideo(req: Request, res: Response): Promise<void> {
  try {
    const { title, description } = req.body;
    const file = (req as any).file;

    if (!file) {
      res.status(400).json({ error: 'Video file is required' });
      return;
    }

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    // Verify Cloudinary write credentials are set before attempting upload
    const hasCloudinaryKeys = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
    if (!hasCloudinaryKeys) {
      res.status(400).json({ 
        error: 'Cloudinary API credentials missing. Please set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend/.env file.' 
      });
      return;
    }

    // Upload to Cloudinary using a stream helper
    console.log('Uploading video to Cloudinary...');
    const uploadPromise = new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'video', folder: 'driptrip_uploads' },
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
      Readable.from(file.buffer).pipe(uploadStream);
    });

    const cloudinaryResult = await uploadPromise;
    const publicId = cloudinaryResult.public_id;
    console.log('Successfully uploaded to Cloudinary. PublicId:', publicId);

    // Insert new Video item into MongoDB
    const videoId = `video-${Date.now()}`;
    const newVideo = await VideoModel.create({
      id: videoId,
      publicId,
      title,
      description: description || '',
      likes: 0,
      likedBy: []
    });

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully to Cloudinary',
      video: {
        id: newVideo.id,
        publicId: newVideo.publicId,
        title: newVideo.title,
        description: newVideo.description,
        likes: newVideo.likes
      }
    });
  } catch (error) {
    console.error('Failed to upload video to Cloudinary:', error);
    res.status(500).json({ error: 'Failed to upload video to Cloudinary. Please verify your API credentials.' });
  }
}
