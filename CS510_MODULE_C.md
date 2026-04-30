# Module C — Knowledge Graph UI


## Overview

A full-stack interactive knowledge graph that visualizes topic relationships mined from flashcard annotations. Users can explore, search, filter, and navigate concepts across their study materials.

## Features

### Graph Visualization
- Three layout algorithms: Force-directed (D3 physics), Hierarchical tree (BFS), Radial (concentric rings)
- Node size scales with card frequency (support count)
- Four edge types with distinct visual styles:
  - `related_to` — solid gray
  - `prerequisite_of` — dashed orange, arrow
  - `variant_of` — dotted blue
  - `used_in` — solid red, arrow
- MiniMap, zoom (0.1x–2x), pan, and auto-fit

### Search (highlight, not filter)
- Typing dims non-matches to 20% opacity; matches glow amber; neighbors stay at 60%
- Enter fits viewport to matches; single match auto-opens detail panel
- Escape clears search and restores all nodes
- 300ms debounce on input

### Filtering
- Deck dropdown (calls `/graph/deck/:deckId` API)
- Confidence threshold slider (0–100%)
- Minimum card count slider (1–20)
- Edge type toggles
- Filters live in a collapsible popover to reduce toolbar noise

### Node Detail Panel
- Shows card count, deck count, connected topics with edge type badges
- "Study this topic" navigates to flashcards filtered by tag
- Click neighbor topics to pan and zoom to them

### URL Deep Linking
- `?deck=deckId` pre-filters by deck
- `?node=topicName` pre-selects a node and opens detail panel

### Performance
- Client-side cap at 150 nodes (top by support), with truncation banner
- Server-side limit of 1000 cards per query
- Layout caching (localStorage for force, in-memory LRU for all)
- Debounced search and confidence refetch

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation: Escape, Enter, Space, Ctrl+F
- Collapsible legend with edge type and node size reference

## Architecture

### Toolbar (two-tier layout)
```
Tier 1: [Title · stats]                    [Search] [⟳]
         ─── border ───
Tier 2: [Deck ▾]  [Force|Tree|Radial]  [Filters ▾]
```

### Data Flow
```
Server (graphController.js)
  └─ buildGraph(): cards with topicNodes → { nodes, edges }
       ↓
Client API (api.js)
  └─ fetchGraph() / fetchGraphByDeck()
       ↓
Zustand Store (graphStore.js)
  └─ nodes, edges, filters, truncation
  └─ getFilteredGraph(): applies minSupport, edgeTypes, confidence
       ↓
GraphCanvas.jsx
  └─ useGraphLayout hook → compute positions (force/tree/radial)
  └─ styledNodes/styledEdges memos → search dimming + hover dimming
       ↓
TopicNode / RelationshipEdge (custom ReactFlow components)
```

### Graph Construction (server)
- Queries flashcards with `topicNodes` field (populated by Module B's topic mining)
- Filters nodes by `minConfidence`
- Counts support (how many cards mention each topic) and deck membership
- Creates edges between all co-occurring topic pairs within each card
- Aggregates edge weight by co-occurrence count

### Key Design Decisions
- **Search is visual-only**: does not remove nodes or trigger layout recomputation
- **Hover and search are layered**: hover overrides search dimming when active
- **Filters behind popover**: sliders and edge chips are set-once controls, kept out of the persistent toolbar
- **Mock data fallback**: 20 CS topics with 25 edges shown when no real data exists

## File Structure

```
client/src/
  components/graph/
    KnowledgeGraphPage.jsx    — page container, URL params, search input
    GraphCanvas.jsx           — ReactFlow canvas, dimming layers, keyboard
    panels/
      GraphControls.jsx       — deck dropdown, layout switcher, filters popover
      GraphLegend.jsx         — collapsible edge/node legend
      NodeDetailPanel.jsx     — selected node details, neighbor navigation
    nodes/TopicNode.jsx       — circular node with size/glow/ring states
    edges/RelationshipEdge.jsx — styled edges with curves and arrows
    hooks/useGraphLayout.js   — force, tree, radial layout algorithms
    mockGraphData.js          — fallback demo data
    graph-overrides.css       — ReactFlow style overrides
  store/graphStore.js         — Zustand store for graph state and filters
  services/api.js             — fetchGraph, fetchGraphByDeck

server/
  routes/graphRoutes.js       — GET /graph, GET /graph/deck/:deckId
  controllers/graphController.js — buildGraph from flashcard topicNodes
```

## Dependencies

- `@xyflow/react` (ReactFlow v12) — graph rendering
- `d3-force`, `d3-hierarchy` — layout algorithms
- `zustand` — state management
- `@heroicons/react` — icons
- Tailwind CSS — styling
