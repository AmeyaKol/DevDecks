which # DevDecks API Documentation

**Base URL:** `https://devdecks-api.onrender.com/api`

**Authentication:** Most write operations require Bearer token authentication.

---

## Authentication

To access protected routes, you must include an `Authorization` header with your JWT token:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

To get a token, login via:

```bash
curl -X POST https://devdecks-api.onrender.com/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

Response:
```json
{
  "_id": "user_id",
  "username": "username",
  "email": "your@email.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 1. Deck Operations

### Create Deck

Creates a new deck for organizing flashcards.

**Endpoint:** `POST /api/decks`

**Authentication:** Required (Bearer token)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "name": "String (required) - Deck name",
  "description": "String (optional) - Deck description",
  "type": "String (required) - One of: DSA | System Design | Behavioral | Technical Knowledge | Other | GRE-Word | GRE-MCQ",
  "isPublic": "Boolean (optional) - Default: true"
}
```

**Example Request:**
```bash
curl -X POST https://devdecks-api.onrender.com/api/decks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Arrays and Strings",
    "description": "Common array and string problems",
    "type": "DSA",
    "isPublic": true
  }'
```

**Success Response (201):**
```json
{
  "_id": "deck_object_id",
  "name": "Arrays and Strings",
  "description": "Common array and string problems",
  "type": "DSA",
  "user": {
    "_id": "user_id",
    "username": "john_doe"
  },
  "isPublic": true,
  "createdAt": "2026-02-02T10:30:00.000Z",
  "updatedAt": "2026-02-02T10:30:00.000Z"
}
```

**Error Responses:**

**400 - Missing Required Field:**
```json
{
  "message": "Deck name is required"
}
```

**400 - Duplicate Deck Name:**
```json
{
  "message": "You already have a deck with this name"
}
```

**401 - Unauthorized:**
```json
{
  "message": "Not authorized, token failed"
}
```

**500 - Server Error:**
```json
{
  "message": "Server Error: Could not create deck",
  "error": "error details"
}
```

---

### Get All Decks

Retrieves decks with pagination and filtering.

**Endpoint:** `GET /api/decks`

**Authentication:** Optional (shows more if authenticated)

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `type` - Filter by type (DSA, System Design, etc.)
- `search` - Search in name and description
- `sort` - Sort order: name | newest | oldest (default: name)
- `paginate` - Enable pagination: true | false (default: true)

**Example Request:**
```bash
# Get all DSA decks without pagination
curl "https://devdecks-api.onrender.com/api/decks?type=DSA&paginate=false"

# Get paginated results with search
curl "https://devdecks-api.onrender.com/api/decks?page=1&limit=10&search=array&sort=newest" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "decks": [
    {
      "_id": "deck_id",
      "name": "Arrays and Strings",
      "description": "Common array and string problems",
      "type": "DSA",
      "user": {
        "_id": "user_id",
        "username": "john_doe"
      },
      "isPublic": true,
      "flashcardCount": 15,
      "createdAt": "2026-02-02T10:30:00.000Z",
      "updatedAt": "2026-02-02T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 45,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 2. Flashcard Operations

### Create Flashcard

Creates a new flashcard and optionally adds it to decks.

**Endpoint:** `POST /api/flashcards`

**Authentication:** Required (Bearer token)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "question": "String (required) - The main question",
  "explanation": "String (required) - Detailed explanation (supports Markdown)",
  "type": "String (required) - One of: DSA | System Design | Behavioral | Technical Knowledge | Other | GRE-Word | GRE-MCQ",
  "hint": "String (optional) - Hint for the question",
  "problemStatement": "String (optional) - Full problem description",
  "code": "String (optional) - Code solution",
  "language": "String (optional) - Code language: python | cpp | java | javascript (default: python)",
  "link": "String (optional) - External reference URL",
  "tags": "Array[String] (optional) - Tags for categorization",
  "decks": "Array[ObjectId] (optional) - Deck IDs to add this card to",
  "isPublic": "Boolean (optional) - Default: true",
  "metadata": "Object (optional) - Type-specific metadata"
}
```

**Example Request:**
```bash
curl -X POST https://devdecks-api.onrender.com/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "question": "Two Sum",
    "problemStatement": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    "hint": "Use a hash map to store complements",
    "explanation": "## Solution\n\nUse a hash map to store each number and its index as we iterate through the array. For each number, check if target - number exists in the map.",
    "code": "def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []",
    "language": "python",
    "link": "https://leetcode.com/problems/two-sum/",
    "type": "DSA",
    "tags": ["array", "hash-table", "easy"],
    "decks": ["your_deck_id_here"],
    "isPublic": true
  }'
```

**Success Response (201):**
```json
{
  "_id": "flashcard_object_id",
  "question": "Two Sum",
  "problemStatement": "Given an array of integers nums and an integer target...",
  "hint": "Use a hash map to store complements",
  "explanation": "## Solution\n\nUse a hash map...",
  "code": "def twoSum(nums, target):\n    seen = {}...",
  "language": "python",
  "link": "https://leetcode.com/problems/two-sum/",
  "type": "DSA",
  "tags": ["array", "hash-table", "easy"],
  "decks": [
    {
      "_id": "deck_id",
      "name": "Arrays and Strings"
    }
  ],
  "user": {
    "_id": "user_id",
    "username": "john_doe"
  },
  "isPublic": true,
  "metadata": {},
  "createdAt": "2026-02-02T10:35:00.000Z",
  "updatedAt": "2026-02-02T10:35:00.000Z"
}
```

**Error Responses:**

**400 - Missing Required Fields:**
```json
{
  "message": "Question, Explanation, and Type are required"
}
```

**401 - Unauthorized:**
```json
{
  "message": "Not authorized, token failed"
}
```

**500 - Server Error:**
```json
{
  "message": "Server Error: Could not create flashcard",
  "error": "error details"
}
```

---

### Get All Flashcards

Retrieves flashcards with pagination and filtering.

**Endpoint:** `GET /api/flashcards`

**Authentication:** Optional (shows more if authenticated)

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `type` - Filter by type
- `deck` - Filter by deck ID
- `tags` - Filter by tags (comma-separated)
- `search` - Search in question, explanation, problemStatement
- `sort` - Sort order: newest | oldest (default: newest)
- `paginate` - Enable pagination: true | false (default: true)

**Example Request:**
```bash
# Get all flashcards in a specific deck
curl "https://devdecks-api.onrender.com/api/flashcards?deck=DECK_ID&paginate=false"

# Search flashcards with tags
curl "https://devdecks-api.onrender.com/api/flashcards?search=array&tags=hash-table,easy&page=1&limit=10"
```

**Success Response (200):**
```json
{
  "flashcards": [
    {
      "_id": "flashcard_id",
      "question": "Two Sum",
      "hint": "Use a hash map",
      "explanation": "...",
      "code": "...",
      "type": "DSA",
      "tags": ["array", "hash-table"],
      "decks": [...],
      "user": {...},
      "createdAt": "2026-02-02T10:35:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 87,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filters": {
    "availableTags": ["array", "string", "hash-table", "tree", ...]
  }
}
```

---

## 3. Folder Operations

### Create Folder

Creates a new folder for organizing decks.

**Endpoint:** `POST /api/folders`

**Authentication:** Required (Bearer token)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "name": "String (required) - Folder name (max 100 chars)",
  "description": "String (optional) - Folder description (max 500 chars)",
  "isPublic": "Boolean (optional) - Default: false"
}
```

**Example Request:**
```bash
curl -X POST https://devdecks-api.onrender.com/api/folders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Interview Prep",
    "description": "All decks for upcoming interviews",
    "isPublic": false
  }'
```

**Success Response (201):**
```json
{
  "_id": "folder_object_id",
  "name": "Interview Prep",
  "description": "All decks for upcoming interviews",
  "user": {
    "_id": "user_id",
    "username": "john_doe"
  },
  "decks": [],
  "isPublic": false,
  "deckCount": 0,
  "createdAt": "2026-02-02T10:40:00.000Z",
  "updatedAt": "2026-02-02T10:40:00.000Z"
}
```

**Error Responses:**

**400 - Missing Required Field:**
```json
{
  "message": "Folder name is required"
}
```

**400 - Duplicate Folder Name:**
```json
{
  "message": "You already have a folder with this name"
}
```

**401 - Unauthorized:**
```json
{
  "message": "Not authorized, token failed"
}
```

**500 - Server Error:**
```json
{
  "message": "Server Error: Could not create folder",
  "error": "error details"
}
```

---

### Get All Folders

Retrieves folders (public + user's private if authenticated).

**Endpoint:** `GET /api/folders`

**Authentication:** Optional (shows more if authenticated)

**Query Parameters:**
- `search` - Search in folder name and description

**Example Request:**
```bash
curl "https://devdecks-api.onrender.com/api/folders" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With search
curl "https://devdecks-api.onrender.com/api/folders?search=interview"
```

**Success Response (200):**
```json
[
  {
    "_id": "folder_id",
    "name": "Interview Prep",
    "description": "All decks for upcoming interviews",
    "user": {
      "_id": "user_id",
      "username": "john_doe"
    },
    "decks": [
      {
        "_id": "deck_id",
        "name": "Arrays and Strings",
        "description": "...",
        "type": "DSA",
        "isPublic": true
      }
    ],
    "isPublic": false,
    "deckCount": 1,
    "createdAt": "2026-02-02T10:40:00.000Z",
    "updatedAt": "2026-02-02T10:40:00.000Z"
  }
]
```

---

### Add Deck to Folder

Adds an existing deck to a folder.

**Endpoint:** `POST /api/folders/:id/decks`

**Authentication:** Required (Bearer token)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**URL Parameters:**
- `:id` - Folder ID

**Request Body:**
```json
{
  "deckId": "String (required) - Deck ObjectId to add"
}
```

**Example Request:**
```bash
curl -X POST https://devdecks-api.onrender.com/api/folders/FOLDER_ID/decks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "deckId": "DECK_ID_TO_ADD"
  }'
```

**Success Response (200):**
```json
{
  "_id": "folder_id",
  "name": "Interview Prep",
  "description": "All decks for upcoming interviews",
  "user": {
    "_id": "user_id",
    "username": "john_doe"
  },
  "decks": [
    {
      "_id": "newly_added_deck_id",
      "name": "Arrays and Strings",
      "description": "...",
      "type": "DSA",
      "isPublic": true
    }
  ],
  "isPublic": false,
  "deckCount": 1,
  "createdAt": "2026-02-02T10:40:00.000Z",
  "updatedAt": "2026-02-02T10:45:00.000Z"
}
```

**Error Responses:**

**400 - Missing Deck ID:**
```json
{
  "message": "Deck ID is required"
}
```

**400 - Deck Already in Folder:**
```json
{
  "message": "Deck is already in this folder"
}
```

**403 - Not Authorized:**
```json
{
  "message": "You can only modify your own folders"
}
```

**404 - Folder or Deck Not Found:**
```json
{
  "message": "Folder not found"
}
// or
{
  "message": "Deck not found"
}
```

---

## Data Type Reference

### Allowed Values

**Deck/Flashcard Types:**
- `DSA` - Data Structures and Algorithms
- `System Design` - System design questions
- `Behavioral` - Behavioral interview questions
- `Technical Knowledge` - General technical knowledge
- `Other` - Other types
- `GRE-Word` - GRE vocabulary words
- `GRE-MCQ` - GRE multiple choice questions

**Code Languages:**
- `python` (default)
- `cpp`
- `java`
- `javascript`

**Boolean Values:**
- `true`
- `false`

**ObjectId:**
- MongoDB ObjectId string (24 hex characters)
- Example: `"507f1f77bcf86cd799439011"`

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

**General API Requests:**
- 100 requests per 15 minutes per IP

**Authentication Routes (login/register):**
- 10 requests per hour per IP

**Read Operations (GET requests):**
- 60 requests per minute per IP

If you exceed the rate limit, you'll receive a 429 response:
```json
{
  "error": "Too many requests from this IP, please try again after 15 minutes"
}
```

---

## Complete Workflow Example

Here's a complete example of creating a deck, adding a flashcard, and organizing in a folder:

```bash
# 1. Login to get token
TOKEN=$(curl -s -X POST https://devdecks-api.onrender.com/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' \
  | jq -r '.token')

# 2. Create a deck
DECK_RESPONSE=$(curl -s -X POST https://devdecks-api.onrender.com/api/decks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "LeetCode Easy",
    "description": "Easy problems for warmup",
    "type": "DSA",
    "isPublic": true
  }')

DECK_ID=$(echo $DECK_RESPONSE | jq -r '._id')
echo "Created deck with ID: $DECK_ID"

# 3. Create a flashcard in that deck
CARD_RESPONSE=$(curl -s -X POST https://devdecks-api.onrender.com/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"question\": \"Two Sum\",
    \"explanation\": \"Use hash map for O(n) solution\",
    \"type\": \"DSA\",
    \"tags\": [\"array\", \"hash-table\"],
    \"decks\": [\"$DECK_ID\"],
    \"isPublic\": true
  }")

CARD_ID=$(echo $CARD_RESPONSE | jq -r '._id')
echo "Created flashcard with ID: $CARD_ID"

# 4. Create a folder
FOLDER_RESPONSE=$(curl -s -X POST https://devdecks-api.onrender.com/api/folders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Interview Prep 2026",
    "description": "All my interview preparation materials",
    "isPublic": false
  }')

FOLDER_ID=$(echo $FOLDER_RESPONSE | jq -r '._id')
echo "Created folder with ID: $FOLDER_ID"

# 5. Add deck to folder
curl -X POST "https://devdecks-api.onrender.com/api/folders/$FOLDER_ID/decks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"deckId\": \"$DECK_ID\"}"

echo "Successfully added deck to folder!"
```

---

## Error Handling

All API endpoints follow consistent error response format:

**4xx Client Errors:**
```json
{
  "message": "Human-readable error message"
}
```

**5xx Server Errors:**
```json
{
  "message": "Server Error: Could not perform operation",
  "error": "Detailed error message (in development mode)"
}
```

**Common HTTP Status Codes:**
- `200` - Success (GET, PUT, DELETE)
- `201` - Created (POST)
- `400` - Bad Request (validation error, missing fields)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (not authorized to access resource)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Tips for Using cURL

**Save token to a file:**
```bash
curl -X POST https://devdecks-api.onrender.com/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' \
  | jq -r '.token' > token.txt

TOKEN=$(cat token.txt)
```

**Pretty print JSON responses:**
```bash
curl ... | jq '.'
```

**Save response to file:**
```bash
curl ... -o response.json
```

**Verbose output for debugging:**
```bash
curl -v ...
```

**Include response headers:**
```bash
curl -i ...
```
