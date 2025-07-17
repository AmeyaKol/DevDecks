This is a full-stack MERN (MongoDB, Express.js, React, Node.js) flashcard application that allows users to create, manage, and study flashcards organized in decks. The application supports various deck types including DSA (Data Structures & Algorithms), System Design, Behavioral, Technical Knowledge, GRE Word, and GRE MCQ.

# Tech Stack
Backend: Node.js, Express.js, MongoDB with Mongoose
Frontend: React 18, React Router, Zustand for state management
Styling: Tailwind CSS, Headless UI, Heroicons
Authentication: JWT (JSON Web Tokens)
Additional Features: YouTube playlist import, Dictionary integration


# Setup and Configuration

Environment Variables
## Backend (.env)

```
// Database
MONGODB_URI=mongodb://localhost:27017/flashcard-app

// JWT
JWT_SECRET=your-secret-key-change-in-production

// Server
PORT=5001
NODE_ENV=development

// External APIs
DICTIONARY_API_KEY=your-dictionary-api-key
YOUTUBE_API_KEY=your-youtube-api-key
```

## Frontend (.env)
```
// API Configuration
REACT_APP_API_URL=http://localhost:5001/api

// App Configuration
REACT_APP_APP_NAME=Flashcard App
REACT_APP_VERSION=1.0.0

```

# Installation and Setup

## Prerequisites
Node.js (v14 or higher)
MongoDB (v4.4 or higher)
npm or yarn
# Installation Steps


## Clone the repository:
```
git clone <repository-url>
cd mern-flashcard-app
```
## Install dependencies:
```
//Install root dependencies
npm install
```
### Install server dependencies
```
cd server
npm install
```
### Install client dependencies
```
cd ../client
npm install
```
Set up environment variables:
### Create server .env file
```
cd server
cp .env.example .env
```
### Edit .env with your configuration

### Create client .env file
```
cd ../client
cp .env.example .env
```
### Edit .env with your configuration
Start MongoDB:
### Using MongoDB service
`sudo systemctl start mongod`

### Or using Docker
`docker run -d -p 27017:27017 --name mongodb mongo:latest`
Run the application:
### From root directory - runs both server and client
`npm run dev`

### Or run separately
```
npm run server  # Runs backend on port 5001
npm run client  # Runs frontend on port 3000
```
