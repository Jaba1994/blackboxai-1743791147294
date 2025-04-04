# SaaS Communication and Content Automation Platform

An AI-powered platform that enables companies to generate consistent messaging across multiple platforms by curating content from Figma and other sources.

## Features

- AI-powered content generation for blogs, design docs, change logs, social posts, emails, and internal communications
- Seamless Figma integration for design content extraction
- Real-time content tracking and analytics
- Multi-channel content distribution
- Sentiment analysis and engagement tracking

## Tech Stack

- Backend: Node.js with Express.js
- Database: MongoDB with Mongoose
- Frontend: React.js
- AI Integration: OpenAI GPT-4
- Design Integration: Figma API
- Authentication: JWT
- Analytics: Chart.js

## Project Structure

```
.
├── backend/           # Node.js Express backend
├── frontend/          # React.js frontend
└── figma-plugin/      # Figma plugin for design sync
```

## Getting Started

1. Clone the repository
2. Set up environment variables in `.env`
3. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install

   # Install Figma plugin dependencies
   cd ../figma-plugin
   npm install
   ```
4. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend development server
   cd ../frontend
   npm start
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
FIGMA_ACCESS_TOKEN=your_figma_access_token
```

## API Documentation

### Authentication Endpoints

- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user

### Content Endpoints

- POST `/api/content/generate` - Generate content using AI
- GET `/api/content/:id` - Get specific content
- GET `/api/content` - List all content

### Analytics Endpoints

- GET `/api/analytics` - Get content analytics
- GET `/api/analytics/sentiment` - Get sentiment analysis

### Figma Integration Endpoints

- POST `/api/figma/sync` - Sync Figma design content
- GET `/api/figma/status` - Get sync status

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.