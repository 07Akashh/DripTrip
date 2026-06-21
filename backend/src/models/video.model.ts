import mongoose, { Schema, Document } from 'mongoose';

export interface IVideo extends Document {
  id: string;
  publicId: string;
  title: string;
  description: string;
  likes: number;
  likedBy: string[];
}

const VideoSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  publicId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] }
});

export const VideoModel = mongoose.model<IVideo>('Video', VideoSchema);
