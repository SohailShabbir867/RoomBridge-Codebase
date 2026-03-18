# RoomBridge

A Smart Room Rental and Roommate Matching Platform.

## Tech Stack
- MongoDB
- Express.js
- React (Vite)
- Node.js
- Tailwind CSS
- Redux Toolkit
- Socket.io

## Running the Application

### Backend
1. Navigate to the backend directory:
   ```bash
   cd roombridge-backend
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd roombridge-frontend
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

### Backend (`roombridge-backend/.env`)
Create a `.env` file in the `roombridge-backend` folder with the following keys:
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
```

### Frontend (`roombridge-frontend/.env`)
Create a `.env` file in the `roombridge-frontend` folder with the following keys:
```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=RoomBridge
```
