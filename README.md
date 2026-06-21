# DripTrip 🎥✨

DripTrip is a high-performance, short-form video streaming web application designed to replicate a premium reels/story layout. Built using a modern monorepo structure, it integrates a React/Vite frontend with an Express/Node.js backend, powered by MongoDB and Cloudinary.

---

## 🚀 Key Features

* **Sleek Reels Interface**: A premium, mobile-optimized slider interface supporting swipe actions, automatic intersection-based video playback, and dynamic skeletons.
* **Smart Deep-Linking**: Share specific videos natively or copy to clipboard. Navigating directly to a link containing `?videoId=video-xxx` automatically opens that video in the modal view.
* **Interactive Engagement**:
  * Persistent like button with a custom floating heart particle emitter animation.
  * Device-specific tracking using a persistent client-side UUID (no user registration required).
  * Share tracking that logs event analytics to the backend.
* **Auto-Play with Sound**: Videos inside the slider modal are unmuted by default when opened via user interaction.
* **Cloudinary Video Streaming**: Dynamic generation of looping boomering preview clips (gifs) and automatic formatting for high-performance streaming.

---

## 🛠 Tech Stack

* **Frontend**: React 19, TypeScript, Vite, Swiper, Vanilla CSS
* **Backend**: Express, Node.js, Mongoose, Multer
* **Database**: MongoDB (Mongoose models)
* **Media Storage**: Cloudinary (video upload stream & transformation URL helpers)
* **Hosting**: Vercel (using Vercel Multi-Service config)

---

## 📁 Repository Structure

```
driptrip/
├── vercel.json                 # Monorepo services routing config for Vercel
├── frontend/                   # React/Vite Application
│   ├── src/
│   │   ├── components/         # Video slider, Like, Share, and UI components
│   │   ├── utils/
│   │   │   ├── api.ts          # Centralized API service client
│   │   │   ├── cloudinary.ts   # Cloudinary streaming/transformation URL helpers
│   │   │   └── device.ts       # Client UUID manager
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── backend/                    # Express API Server
    ├── src/
    │   ├── controllers/        # Express handlers (like, share, upload, list)
    │   ├── models/             # Mongoose schemas (Video)
    │   ├── routes/             # API routes definition
    │   └── server.ts           # Application entrypoint & MongoDB connector
    ├── package.json
    └── tsconfig.json
```

---

## ⚙️ Configuration & Environment Variables

### Backend Environment Variables
Create a file named `.env` in the `backend/` directory:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/driptrip
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend Environment Variables
By default, the frontend automatically selects `http://localhost:5001` for local development, and the relative path prefix `/_/backend` when deployed in production on Vercel. 
To override this behavior, you can optionally create a `.env` file in the `frontend/` directory:
```env
VITE_API_BASE_URL=http://localhost:5001
```

---

## 🏃 Local Development

First, ensure you have MongoDB running locally (`brew services start mongodb-community` on macOS).

### 1. Run the Backend
```bash
cd backend
npm install
npm run dev
```
The backend server will run on `http://localhost:5001`.

### 2. Run the Frontend
```bash
cd ../frontend
npm install
npm run dev
```
The Vite development server will start (typically on `http://localhost:5173`).

---

## ☁️ Vercel Deployment (Vercel Services)

DripTrip is configured for **Vercel Services**, meaning both frontend and backend deploy within the same Vercel project under a single domain.

Routing is defined in **[vercel.json](file:///Users/rahul/Desktop/driptrip/vercel.json)**:
* `frontend` is mounted on `/`
* `backend` is mounted on `/_/backend`

To deploy:
1. Ensure your Vercel project's **Framework Preset** is set to **Services** in the Vercel Dashboard.
2. Link the repository to Vercel and trigger the build. Vercel will automatically build the Vite app and set up your Node/Express backend as a serverless function.
