# Changelog

### 2026-09-25
- **Review** keeps your cursor in place while typing recall answers or changing session settings.

### 2026-09-17
- **Company mock OA** lets you choose a company and open 2–4 random LeetCode problems with balanced difficulty, plus individual links if your browser blocks tabs.
- **Problem list** now includes 382 additional LeetCode problems, 263 supplied contest ratings, and refreshed company associations. The Frequency column has been removed.
- **Problem list imports** correctly display titles containing commas without shifting tags or company names into the wrong columns.

### 2026-09-09
- **End of Day revision** now surfaces cards you took notes on today even if they were added earlier (YouTube playlist, split-card, or extension imports), and skips placeholder cards you haven't written notes on yet
- Added a **Review** screen (Profile → Review) — a spaced-repetition session over cards that are due plus recent cards you haven't reviewed yet, with filters for deck, card type, and how far back to pull new cards. Grading a card schedules when it comes back (SM-2)
- **Knowledge graph** loads faster, especially on repeat visits, and re-opening or lightly editing a card (changing visibility, moving it between decks) no longer re-runs its AI processing
- **Chat scoped to a deck** now considers every card in that deck, so exact keyword and code matches are no longer missed when the wording differs from your question

### 2026-08-19
- Added **Custom deck type** — define up to 6 fields (text, link, markdown, code, or multiple choice) per deck and author cards against that structure
- **Moved Deck Manager** from the Home page to Profile (**Manage Decks**)
- Deleting a **Custom deck** now warns that it will also permanently delete every card in it, since those cards can't exist without the deck's field structure
- Fixed **multiple choice rendering** on Custom deck cards to match the existing GRE-MCQ style (lettered options, click-to-reveal) instead of showing raw text
- Restyled **Folder View** and folder cards to match the rest of the app

### 2025-07-17
- Added **Study View** for convenient viewing and note-taking for youtube playlists

### 2025-07-15
- Added **Youtube Playlist Import**

### 2025-07-09
- Added **User Profile Dashboard**
- Added multiple features to the user profile such as **User-created decks**, **Recent Decks**, **Completed Problems**

### 2025-07-08
- Added **Company-wise problems**
- New Problem List now has **2900+** problems
### 2025-07-06
- **Users can like/favorite decks**

### 2025-07-02
- **Added support for C++, Java, and JavaScript** in flashcards and testing
- Improved card updating in **DeckView**

### 2025-07-01
- Added separate **DeckView** component for detailed deck viewing
- Added **footer** to all components
- **Many UI/UX improvements**

### 2025-06-30
- **Deck list** in DeckManager now only shows your decks
- Added **test users**
- **Disabled registration** from frontend
- **Test ID in URL** and start-test from home page
- Added **animated dropdown** for filters

### 2025-06-28
- Refactored website logic from **Zustand store-based to routing-based navigation**

### 2025-06-26
- Added **Problem Completed** field for users and checkboxes in problem list
- Removed large CSV files from repo
- **Implemented dictionary feature** (lookup and auto-create GRE word cards)

### 2025-06-24
- Added **auto DSA filtering** on clicking hero page buttons
- Added more problems to the **problem list**

### 2025-06-23
- Created **Problem List** feature with tags and advanced filtering
- Added cards to **hero page** and button to home page

### 2025-06-22
- Added **GRE card types**, lookup button for GRE cards, and many more changes

### 2025-06-19
- Added **Oldest/Newest toggle** button for sorting
- Improved button redirection in **hero page**

### 2025-06-18
- Added **Hero Page**
- Improved website title and minor UI changes
- Added **search and pagination**

### 2025-06-14
- Added **Problem Statement** field to flashcards
- Improved file structure in **components** folder
- Improved **dark mode** and added confirmation toast
- Made **CodeEditor** permanently dark
- Restored clickable **tag bubble filter** interface
- Implemented complete **user authentication system** with ownership controls and privacy settings

### 2025-06-13
- Added reusable **CodeEditor** with live Python highlighting
- Integrated CodeEditor into **FlashcardForm** and **TestTab**
- Added **Test tab** with deck-based testing, DSA code scaffold, and answer comparison

### 2025-05-30
- **Tags and Decks** working, created two pages

### 2025-05-29
- **First commit:** Flashcards working properly 