# MERN Flashcard Application - Comprehensive API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Backend API Documentation](#backend-api-documentation)
   - [Authentication APIs](#authentication-apis)
   - [Deck Management APIs](#deck-management-apis)
   - [Flashcard APIs](#flashcard-apis)
   - [Dictionary API](#dictionary-api)
   - [YouTube Integration API](#youtube-integration-api)
3. [Frontend Component Documentation](#frontend-component-documentation)
   - [Main Components](#main-components)
   - [Common Components](#common-components)
   - [Deck Components](#deck-components)
   - [Flashcard Components](#flashcard-components)
   - [Authentication Components](#authentication-components)
4. [State Management](#state-management)
5. [Services and Utilities](#services-and-utilities)
6. [Data Models](#data-models)
7. [Setup and Configuration](#setup-and-configuration)

---

## Overview

This is a full-stack MERN (MongoDB, Express.js, React, Node.js) flashcard application that allows users to create, manage, and study flashcards organized in decks. The application supports various deck types including DSA (Data Structures & Algorithms), System Design, Behavioral, Technical Knowledge, GRE Word, and GRE MCQ.

### Tech Stack
- **Backend**: Node.js, Express.js, MongoDB with Mongoose
- **Frontend**: React 18, React Router, Zustand for state management
- **Styling**: Tailwind CSS, Headless UI, Heroicons
- **Authentication**: JWT (JSON Web Tokens)
- **Additional Features**: YouTube playlist import, Dictionary integration

---

## Backend API Documentation

### Base URL
```
http://localhost:5001/api
```

### Authentication APIs

#### Register User
- **Endpoint**: `POST /api/users/register`
- **Description**: Register a new user account
- **Request Body**:
```json
{
  "username": "string (3-20 chars, required)",
  "email": "string (valid email, required)",
  "password": "string (min 6 chars, required)"
}
```
- **Response**:
```json
{
  "_id": "user_id",
  "username": "username",
  "email": "email",
  "token": "jwt_token"
}
```
- **Status Codes**: 201 (Created), 400 (Bad Request), 409 (Conflict)

#### Login User
- **Endpoint**: `POST /api/users/login`
- **Description**: Authenticate user and return JWT token
- **Request Body**:
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```
- **Response**:
```json
{
  "_id": "user_id",
  "username": "username",
  "email": "email",
  "token": "jwt_token"
}
```
- **Status Codes**: 200 (OK), 401 (Unauthorized)

#### Get User Profile
- **Endpoint**: `GET /api/users/profile`
- **Description**: Get authenticated user's profile information
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "_id": "user_id",
  "username": "username",
  "email": "email",
  "problemsCompleted": ["problem1", "problem2"],
  "favorites": ["deck_id1", "deck_id2"],
  "recentDecks": ["deck_id1", "deck_id2"]
}
```
- **Status Codes**: 200 (OK), 401 (Unauthorized)

#### Update Problems Completed
- **Endpoint**: `POST /api/users/problems-completed`
- **Description**: Add a problem to user's completed list
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "problemId": "string (required)"
}
```
- **Status Codes**: 200 (OK), 401 (Unauthorized)

#### Add to Favorites
- **Endpoint**: `POST /api/users/favorites/add`
- **Description**: Add a deck to user's favorites
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "deckId": "string (required)"
}
```
- **Status Codes**: 200 (OK), 401 (Unauthorized)

#### Remove from Favorites
- **Endpoint**: `POST /api/users/favorites/remove`
- **Description**: Remove a deck from user's favorites
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "deckId": "string (required)"
}
```
- **Status Codes**: 200 (OK), 401 (Unauthorized)

#### Update Recent Decks
- **Endpoint**: `POST /api/users/recent-deck`
- **Description**: Add a deck to user's recently viewed list
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "deckId": "string (required)"
}
```
- **Status Codes**: 200 (OK), 401 (Unauthorized)

### Deck Management APIs

#### Create Deck
- **Endpoint**: `POST /api/decks`
- **Description**: Create a new flashcard deck
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "type": "DSA|System Design|Behavioral|Technical Knowledge|Other|GRE-Word|GRE-MCQ",
  "isPublic": "boolean (default: false)"
}
```
- **Response**:
```json
{
  "_id": "deck_id",
  "name": "deck_name",
  "description": "deck_description",
  "type": "DSA",
  "user": "user_id",
  "isPublic": false,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```
- **Status Codes**: 201 (Created), 400 (Bad Request), 401 (Unauthorized)

#### Get All Decks
- **Endpoint**: `GET /api/decks`
- **Description**: Retrieve all public decks and user's private decks (if authenticated)
- **Headers**: `Authorization: Bearer <token>` (optional)
- **Query Parameters**:
  - `type`: Filter by deck type
  - `search`: Search in deck names and descriptions
- **Response**:
```json
[
  {
    "_id": "deck_id",
    "name": "deck_name",
    "description": "deck_description",
    "type": "DSA",
    "user": {
      "_id": "user_id",
      "username": "username"
    },
    "isPublic": true,
    "flashcardCount": 10,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```
- **Status Codes**: 200 (OK)

#### Get Deck by ID
- **Endpoint**: `GET /api/decks/:id`
- **Description**: Retrieve a specific deck by ID
- **Headers**: `Authorization: Bearer <token>` (optional)
- **Response**: Same as single deck object from Get All Decks
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Update Deck
- **Endpoint**: `PUT /api/decks/:id`
- **Description**: Update a deck (only by owner)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: Same as Create Deck
- **Response**: Updated deck object
- **Status Codes**: 200 (OK), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)

#### Delete Deck
- **Endpoint**: `DELETE /api/decks/:id`
- **Description**: Delete a deck (only by owner)
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "message": "Deck deleted successfully"
}
```
- **Status Codes**: 200 (OK), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)

#### Get Deck Types
- **Endpoint**: `GET /api/decks/types`
- **Description**: Get all available deck types
- **Response**:
```json
{
  "types": ["DSA", "System Design", "Behavioral", "Technical Knowledge", "Other", "GRE-Word", "GRE-MCQ"]
}
```
- **Status Codes**: 200 (OK)

### Flashcard APIs

#### Get Flashcards
- **Endpoint**: `GET /api/flashcards`
- **Description**: Retrieve flashcards with optional filtering
- **Headers**: `Authorization: Bearer <token>` (optional)
- **Query Parameters**:
  - `deck`: Filter by deck ID
  - `tags`: Filter by tags (comma-separated)
  - `search`: Search in question and answer content
- **Response**:
```json
[
  {
    "_id": "flashcard_id",
    "question": "What is React?",
    "answer": "A JavaScript library for building user interfaces",
    "tags": ["react", "frontend"],
    "deck": "deck_id",
    "user": "user_id",
    "difficulty": "Medium",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```
- **Status Codes**: 200 (OK)

#### Create Flashcard
- **Endpoint**: `POST /api/flashcards`
- **Description**: Create a new flashcard
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "question": "string (required)",
  "answer": "string (required)",
  "tags": ["string"] (optional),
  "deck": "deck_id (required)",
  "difficulty": "Easy|Medium|Hard" (optional)
}
```
- **Response**: Created flashcard object
- **Status Codes**: 201 (Created), 400 (Bad Request), 401 (Unauthorized)

#### Update Flashcard
- **Endpoint**: `PUT /api/flashcards/:id`
- **Description**: Update a flashcard (only by owner)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: Same as Create Flashcard
- **Response**: Updated flashcard object
- **Status Codes**: 200 (OK), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)

#### Delete Flashcard
- **Endpoint**: `DELETE /api/flashcards/:id`
- **Description**: Delete a flashcard (only by owner)
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "message": "Flashcard deleted successfully"
}
```
- **Status Codes**: 200 (OK), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)

### Dictionary API

#### Get Word Data
- **Endpoint**: `GET /api/dictionary`
- **Description**: Get word definition and pronunciation from external dictionary API
- **Query Parameters**:
  - `word`: The word to look up (required)
- **Response**:
```json
{
  "word": "example",
  "definitions": [
    {
      "partOfSpeech": "noun",
      "definition": "a thing characteristic of its kind or illustrating a general rule"
    }
  ],
  "pronunciation": "/ɪɡˈzɑːmpl/"
}
```
- **Status Codes**: 200 (OK), 400 (Bad Request), 404 (Not Found)

### YouTube Integration API

#### Import YouTube Playlist
- **Endpoint**: `POST /api/youtube/playlist`
- **Description**: Import flashcards from a YouTube playlist
- **Request Body**:
```json
{
  "playlistUrl": "string (required)",
  "deckId": "string (required)"
}
```
- **Response**:
```json
{
  "message": "Playlist imported successfully",
  "flashcardsCreated": 10
}
```
- **Status Codes**: 200 (OK), 400 (Bad Request)

#### Test API Key
- **Endpoint**: `GET /api/youtube/test-key`
- **Description**: Test if YouTube API key is valid
- **Response**:
```json
{
  "valid": true,
  "message": "API key is valid"
}
```
- **Status Codes**: 200 (OK), 401 (Unauthorized)

---

## Frontend Component Documentation

### Main Components

#### App Component
- **File**: `client/src/App.jsx`
- **Description**: Main application component that handles routing and global state
- **Props**: None
- **Key Features**:
  - Route management using React Router
  - Authentication state management
  - Global modal and toast handling
  - Dark mode support

**Usage Example**:
```jsx
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

function Root() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
}
```

#### Hero Component
- **File**: `client/src/components/Hero.jsx`
- **Description**: Landing page hero section with feature highlights
- **Props**:
  - `onGetStarted`: Function called when "Get Started" button is clicked
- **Features**:
  - Responsive design
  - Feature showcase
  - Call-to-action buttons

#### HomePage Component
- **File**: `client/src/components/HomePage.jsx`
- **Description**: Main dashboard showing decks and flashcards
- **Props**: None
- **Features**:
  - Deck and flashcard listing
  - Search and filtering
  - Pagination
  - User authentication integration

#### DeckView Component
- **File**: `client/src/components/DeckView.jsx`
- **Description**: Detailed view of a specific deck with its flashcards
- **Props**: 
  - Uses URL parameters to get deck ID
- **Features**:
  - Flashcard browsing
  - Study mode
  - Deck management (edit/delete)
  - Favorite functionality

#### Profile Component
- **File**: `client/src/components/Profile.jsx`
- **Description**: User profile page showing personal statistics and preferences
- **Props**: None
- **Features**:
  - User statistics
  - Recent decks
  - Favorite decks
  - Problem completion tracking

### Common Components

#### Modal Component
- **File**: `client/src/components/common/Modal.jsx`
- **Description**: Reusable modal dialog component
- **Props**:
  - `isOpen`: Boolean to control visibility
  - `onClose`: Function called when modal is closed
  - `title`: Modal title
  - `children`: Modal content

**Usage Example**:
```jsx
<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirm Action">
  <p>Are you sure you want to proceed?</p>
  <div className="mt-4 flex gap-2">
    <button onClick={handleConfirm}>Confirm</button>
    <button onClick={() => setIsModalOpen(false)}>Cancel</button>
  </div>
</Modal>
```

#### Toast Component
- **File**: `client/src/components/common/Toast.jsx`
- **Description**: Toast notification component for user feedback
- **Props**:
  - `message`: Toast message text
  - `type`: Toast type ('success', 'error', 'info')
  - `isVisible`: Boolean to control visibility
  - `onClose`: Function called when toast is dismissed

#### Pagination Component
- **File**: `client/src/components/common/Pagination.jsx`
- **Description**: Pagination component for large data sets
- **Props**:
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `onPageChange`: Function called when page changes
  - `itemsPerPage`: Number of items per page
  - `totalItems`: Total number of items

**Usage Example**:
```jsx
<Pagination
  currentPage={currentPage}
  totalPages={Math.ceil(totalItems / itemsPerPage)}
  onPageChange={setCurrentPage}
  itemsPerPage={10}
  totalItems={totalItems}
/>
```

#### CodeEditor Component
- **File**: `client/src/components/common/CodeEditor.jsx`
- **Description**: Code editor with syntax highlighting for flashcard content
- **Props**:
  - `value`: Current code value
  - `onChange`: Function called when code changes
  - `language`: Programming language for syntax highlighting
  - `placeholder`: Placeholder text

**Usage Example**:
```jsx
<CodeEditor
  value={code}
  onChange={setCode}
  language="javascript"
  placeholder="Enter your code here..."
/>
```

#### AnimatedDropdown Component
- **File**: `client/src/components/common/AnimatedDropdown.jsx`
- **Description**: Animated dropdown menu component
- **Props**:
  - `options`: Array of option objects
  - `value`: Currently selected value
  - `onChange`: Function called when selection changes
  - `placeholder`: Placeholder text

### Deck Components

#### DeckCard Component
- **File**: `client/src/components/deck/DeckCard.jsx`
- **Description**: Individual deck card component for display in lists
- **Props**:
  - `deck`: Deck object
  - `onEdit`: Function called when edit is requested
  - `onDelete`: Function called when delete is requested
  - `onView`: Function called when deck is viewed

**Usage Example**:
```jsx
<DeckCard
  deck={deck}
  onEdit={() => handleEdit(deck)}
  onDelete={() => handleDelete(deck.id)}
  onView={() => navigate(`/deck/${deck.id}`)}
/>
```

#### DeckForm Component
- **File**: `client/src/components/deck/DeckForm.jsx`
- **Description**: Form component for creating and editing decks
- **Props**:
  - `deck`: Existing deck object (for editing)
  - `onSave`: Function called when form is saved
  - `onCancel`: Function called when form is cancelled

#### DeckList Component
- **File**: `client/src/components/deck/DeckList.jsx`
- **Description**: List component displaying multiple deck cards
- **Props**:
  - `decks`: Array of deck objects
  - `onDeckAction`: Function called for deck actions

#### DeckManager Component
- **File**: `client/src/components/deck/DeckManager.jsx`
- **Description**: Complete deck management interface
- **Props**: None
- **Features**:
  - Deck creation, editing, deletion
  - Search and filtering
  - Pagination
  - Bulk operations

### Flashcard Components

#### FlashcardItem Component
- **File**: `client/src/components/flashcard/FlashcardItem.jsx`
- **Description**: Individual flashcard display component
- **Props**:
  - `flashcard`: Flashcard object
  - `onEdit`: Function called when edit is requested
  - `onDelete`: Function called when delete is requested
  - `showAnswer`: Boolean to control answer visibility

**Usage Example**:
```jsx
<FlashcardItem
  flashcard={flashcard}
  onEdit={() => handleEdit(flashcard)}
  onDelete={() => handleDelete(flashcard.id)}
  showAnswer={showAnswer}
/>
```

#### FlashcardForm Component
- **File**: `client/src/components/flashcard/FlashcardForm.jsx`
- **Description**: Comprehensive form for creating and editing flashcards
- **Props**:
  - `flashcard`: Existing flashcard object (for editing)
  - `deckId`: ID of the deck to add flashcard to
  - `onSave`: Function called when form is saved
  - `onCancel`: Function called when form is cancelled

**Features**:
  - Rich text editing
  - Code syntax highlighting
  - Tag management
  - Difficulty selection
  - Preview mode

#### FlashcardList Component
- **File**: `client/src/components/flashcard/FlashcardList.jsx`
- **Description**: List component displaying multiple flashcards
- **Props**:
  - `flashcards`: Array of flashcard objects
  - `onFlashcardAction`: Function called for flashcard actions

### Authentication Components

#### LoginForm Component
- **File**: `client/src/components/LoginForm.jsx`
- **Description**: User login form component
- **Props**:
  - `onSuccess`: Function called on successful login
  - `onSwitchToRegister`: Function called to switch to register form

#### RegisterForm Component
- **File**: `client/src/components/RegisterForm.jsx`
- **Description**: User registration form component
- **Props**:
  - `onSuccess`: Function called on successful registration
  - `onSwitchToLogin`: Function called to switch to login form

#### AuthModal Component
- **File**: `client/src/components/auth/AuthModal.jsx`
- **Description**: Modal containing authentication forms
- **Props**:
  - `isOpen`: Boolean to control modal visibility
  - `onClose`: Function called when modal is closed
  - `initialMode`: Initial form mode ('login' or 'register')

---

## State Management

### Flashcard Store (Zustand)
- **File**: `client/src/store/flashcardStore.js`
- **Description**: Global state management for flashcards and decks

#### State Properties:
```javascript
{
  flashcards: [],           // Array of flashcard objects
  decks: [],               // Array of deck objects
  allTags: [],             // Array of unique tags
  isLoading: false,        // Loading state for flashcards
  isLoadingDecks: false,   // Loading state for decks
  error: null,             // Error message
  currentPage: 'cards',    // Current page view
  editingFlashcard: null,  // Currently editing flashcard
  editingDeck: null,       // Currently editing deck
  selectedTypeFilter: 'All', // Type filter selection
  selectedDeckFilter: 'All', // Deck filter selection
  selectedTagsFilter: [],   // Tags filter selection
  searchQuery: '',         // Search query string
  showFavoritesOnly: false, // Favorites filter toggle
  currentPageNumber: 1,    // Current pagination page
  itemsPerPage: 5,         // Items per page
  viewMode: 'decks',       // View mode ('cards' or 'decks')
  selectedDeckForView: null, // Selected deck for viewing
  sortOrder: 'newest',     // Sort order ('newest' or 'oldest')
  toast: null,             // Toast notification data
  darkMode: false          // Dark mode toggle
}
```

#### Key Actions:
- `fetchDecks()`: Fetch all decks from API
- `fetchFlashcards()`: Fetch all flashcards from API
- `createDeck(deckData)`: Create new deck
- `updateDeck(id, deckData)`: Update existing deck
- `deleteDeck(id)`: Delete deck
- `createFlashcard(flashcardData)`: Create new flashcard
- `updateFlashcard(id, flashcardData)`: Update existing flashcard
- `deleteFlashcard(id)`: Delete flashcard
- `setFilters(filters)`: Set search and filter criteria
- `setPagination(page, itemsPerPage)`: Set pagination parameters
- `showToast(message, type)`: Show toast notification
- `toggleDarkMode()`: Toggle dark mode

**Usage Example**:
```javascript
import useFlashcardStore from '../store/flashcardStore';

function MyComponent() {
  const {
    decks,
    isLoadingDecks,
    fetchDecks,
    createDeck,
    showToast
  } = useFlashcardStore();

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  const handleCreateDeck = async (deckData) => {
    try {
      await createDeck(deckData);
      showToast('Deck created successfully!', 'success');
    } catch (error) {
      showToast('Failed to create deck', 'error');
    }
  };

  return (
    <div>
      {isLoadingDecks ? (
        <div>Loading...</div>
      ) : (
        <div>
          {decks.map(deck => (
            <div key={deck._id}>{deck.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Auth Context
- **File**: `client/src/context/AuthContext.js`
- **Description**: Authentication state management using React Context

#### Context Value:
```javascript
{
  user: null,              // Current user object
  isAuthenticated: false,  // Authentication status
  loading: false,          // Loading state
  error: null,             // Error message
  login: (email, password), // Login function
  register: (userData),    // Register function
  logout: (),              // Logout function
  clearError: ()           // Clear error function
}
```

**Usage Example**:
```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          Welcome, {user.username}!
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={() => handleLogin('email', 'password')}>
          Login
        </button>
      )}
    </div>
  );
}
```

---

## Services and Utilities

### API Service
- **File**: `client/src/services/api.js`
- **Description**: Axios instance configured with interceptors for API communication

#### Configuration:
- Base URL: `process.env.REACT_APP_API_URL` or `http://localhost:5001/api`
- Automatic JWT token injection
- Response error handling
- Request/response logging (in development)

#### Interceptors:
- **Request Interceptor**: Adds JWT token to Authorization header
- **Response Interceptor**: Handles 401 errors and token refresh

**Usage Example**:
```javascript
import api from '../services/api';

// GET request
const response = await api.get('/decks');

// POST request
const newDeck = await api.post('/decks', {
  name: 'My New Deck',
  type: 'DSA'
});

// PUT request
const updatedDeck = await api.put(`/decks/${deckId}`, updateData);

// DELETE request
await api.delete(`/decks/${deckId}`);
```

---

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  username: String (3-20 chars, unique, required),
  email: String (valid email, unique, required),
  password: String (min 6 chars, hashed, required),
  problemsCompleted: [String],
  favorites: [ObjectId] (refs to Deck),
  recentDecks: [ObjectId] (refs to Deck),
  createdAt: Date,
  updatedAt: Date
}
```

### Deck Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String (default: ''),
  type: String (enum: ['DSA', 'System Design', 'Behavioral', 'Technical Knowledge', 'Other', 'GRE-Word', 'GRE-MCQ'], required),
  user: ObjectId (ref to User, required),
  isPublic: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### Flashcard Model
```javascript
{
  _id: ObjectId,
  question: String (required),
  answer: String (required),
  tags: [String] (default: []),
  difficulty: String (enum: ['Easy', 'Medium', 'Hard'], default: 'Medium'),
  deck: ObjectId (ref to Deck, required),
  user: ObjectId (ref to User, required),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Setup and Configuration

### Environment Variables

#### Backend (.env)
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/flashcard-app

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Server
PORT=5001
NODE_ENV=development

# External APIs
DICTIONARY_API_KEY=your-dictionary-api-key
YOUTUBE_API_KEY=your-youtube-api-key
```

#### Frontend (.env)
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5001/api

# App Configuration
REACT_APP_APP_NAME=Flashcard App
REACT_APP_VERSION=1.0.0
```

### Installation and Setup

#### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

#### Installation Steps

1. **Clone the repository**:
```bash
git clone <repository-url>
cd mern-flashcard-app
```

2. **Install dependencies**:
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. **Set up environment variables**:
```bash
# Create server .env file
cd server
cp .env.example .env
# Edit .env with your configuration

# Create client .env file
cd ../client
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB**:
```bash
# Using MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

5. **Run the application**:
```bash
# From root directory - runs both server and client
npm run dev

# Or run separately
npm run server  # Runs backend on port 5001
npm run client  # Runs frontend on port 3000
```

### API Testing

You can test the APIs using tools like Postman or curl. Here are some example requests:

#### Register a new user:
```bash
curl -X POST http://localhost:5001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Create a new deck:
```bash
curl -X POST http://localhost:5001/api/decks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "JavaScript Fundamentals",
    "description": "Basic JavaScript concepts",
    "type": "Technical Knowledge",
    "isPublic": true
  }'
```

#### Create a flashcard:
```bash
curl -X POST http://localhost:5001/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "question": "What is a closure in JavaScript?",
    "answer": "A closure is a function that has access to variables in its outer scope even after the outer function has returned.",
    "tags": ["javascript", "closures", "functions"],
    "deck": "DECK_ID_HERE",
    "difficulty": "Medium"
  }'
```

---

## Error Handling

### Backend Error Responses
All API endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)",
  "statusCode": 400
}
```

### Common HTTP Status Codes
- `200`: OK - Request successful
- `201`: Created - Resource created successfully
- `400`: Bad Request - Invalid request data
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Access denied
- `404`: Not Found - Resource not found
- `409`: Conflict - Resource already exists
- `500`: Internal Server Error - Server error

### Frontend Error Handling
The frontend handles errors through:
- Global error boundaries
- API service error interceptors
- Toast notifications for user feedback
- Form validation and error display

---

## Performance Considerations

### Backend Optimizations
- Database indexing on frequently queried fields
- Pagination for large data sets
- JWT token caching
- Request rate limiting
- Database connection pooling

### Frontend Optimizations
- Lazy loading of components
- Memoization of expensive calculations
- Efficient state updates
- Image optimization
- Bundle splitting and code splitting

---

## Security Features

### Authentication & Authorization
- JWT-based authentication
- Password hashing using bcrypt
- Protected routes and middleware
- Token expiration handling

### Data Validation
- Input sanitization
- Schema validation
- XSS protection
- CORS configuration

### Privacy Controls
- Public/private deck settings
- User-specific data access
- Secure API endpoints

---

This documentation provides comprehensive coverage of all public APIs, components, and utilities in the MERN Flashcard Application. For additional support or questions, please refer to the code comments or create an issue in the repository.