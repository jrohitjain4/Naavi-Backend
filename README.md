# Navi Backend

Node.js backend API with MongoDB.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure MongoDB is running on your system or update the `MONGODB_URI` in `.env`

3. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## Environment Variables

Copy `.env.example` to `.env` and update the values:
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `NODE_ENV`: Environment (development/production)

## Project Structure

```
Navi-backend/
├── server.js          # Main server file
├── routes/            # API routes
├── models/            # MongoDB models
├── controllers/       # Route controllers
├── middleware/        # Custom middleware
└── .env              # Environment variables
```

