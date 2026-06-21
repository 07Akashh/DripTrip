import { Router } from 'express';
import multer from 'multer';
import { getVideos, likeVideo, shareVideo, uploadVideo } from '../controllers/video.controller';

const router = Router();
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB file size limit

// Define API routes
router.get('/videos', getVideos);
router.post('/like', likeVideo);
router.post('/share', shareVideo);
router.post('/videos/upload', upload.single('video'), uploadVideo);

export default router;
