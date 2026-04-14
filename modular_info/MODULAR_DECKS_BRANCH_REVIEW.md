# Modular decks + custom deck typing (branches `modular`, `modularDecks`)

This document summarizes how **custom deck types / modular field schemas** were implemented on the legacy branches `modular` and `modularDecks`, to inform an eventual integration into the current `master` (which is many commits ahead).

It focuses on:

1. Custom deck type creation
2. Preset deck types (DSA, System Design, etc.)
3. Rendering (create/edit + study/test rendering strategies)
4. Card–deck relationship (coupling constraints)
5. Data model for cards/decks/users

---

## Executive summary

- `**modularDecks`** implemented a *first pass* at modular typing via a new Mongo model `**DeckType*`* and referenced it from `Deck.deckType`. Flashcards used `**Flashcard.fields`** (a dynamic object) and allowed a **many-to-many** relation via `Flashcard.decks[]`. Rendering happened via a per-field React component (`DynamicField`) that switches on `field.type`.
- `**modular`** pivoted to storing the schema on the **deck** itself as `Deck.fieldConfig` with a `template` + `fields[]`, backed by a shared **template catalog** in `server/services/deckTemplateService.js` and `client/src/utils/fieldTypes.js`. Flashcards stored modular content in `**Flashcard.fieldData`**, and introduced `**Flashcard.primaryDeck`** as the intended coupling point (while still keeping `Flashcard.decks[]` around).
- **Key architectural tension** (you called this out): if a flashcard can appear in decks with *different* schemas/renderers, the flashcard becomes ambiguous to render.  
  - `modularDecks`: many-to-many is allowed by design (and therefore unsafe if mixed deck types are used).  
  - `modular`: introduces `primaryDeck` and validates `fieldData` against *that* deck’s schema, which is a step toward “flashcard tightly coupled to a deck”, but the model still retains `decks[]` and the API still allows it, so the constraint is **conventional**, not **enforced**.

---

## 1) Custom deck type creation

### Branch: `modularDecks` (DeckType model + builder UI)

**Backend**

- **Model**: `server/models/DeckType.js`
  - Stores `name`, `description`, `category`, `icon`, `color`, `isSystem`, `isPublic`, `user`, and `**fields[]`**.
  - Each field has: `name`, `label`, `type`, `required`, `config` (mixed), and `order`.
  - Field `type` enum includes: `text`, `markdown`, `code`, `mcq`, `link`, `video`, `image`, `number`, `boolean`.
- **Routes/controller**:
  - `server/routes/deckTypeRoutes.js`
  - `server/controllers/deckTypeController.js`
    - `POST /api/deck-types` create deck type (auth required).
    - `GET /api/deck-types` list (system + public + user-owned private, with `optionalAuth`).
    - `GET /api/deck-types/:id` fetch with access checks.
    - `PUT /api/deck-types/:id` update (owner-only, cannot update system).
    - `DELETE /api/deck-types/:id` delete (owner-only, cannot delete system).
    - `GET /api/deck-types/field-types` returns the “preset” field types and config knobs (used by UI).

**Frontend**

- **Deck type builder**: `client/src/components/deck/DeckTypeBuilder.jsx`
  - Modal UI that lets you add/reorder fields and set per-type config (e.g., MCQ options, code language).
  - Calls API helpers in `client/src/services/api.js` (`createDeckType`, `updateDeckType`, `fetchFieldTypes`, etc.).

### Branch: `modular` (DeckCreator creates custom per-deck schema)

Instead of a global “DeckType” entity, `modular` implements “custom typing” as a **per-deck fieldConfig**.

**Frontend**

- **Deck creator wizard**: `client/src/components/deck-creator/DeckCreator.jsx`
  - Step-based UX: basic info → template selection → field design → preview.
  - Produces a `deckToSave` payload:
    - `name`, `description`, `type`, `isPublic`
    - `fieldConfig: { template, fields[], version, updatedAt }`
- **Field designer/editor**:
  - `client/src/components/deck-creator/FieldDesigner.jsx` + `FieldEditor.jsx`
  - Uses `client/src/utils/fieldTypes.js` as the catalog of field types and template scaffolding.

**Backend**

- Deck creation endpoint in `server/controllers/deckController.js` accepts `fieldConfig` (optional), otherwise generates it from a template (see section 2).

**Implication**

- In `modular`, “custom deck typing” is done by creating a new deck whose `fieldConfig.template` is `Custom` and whose `fieldConfig.fields[]` describes the schema.
- There is no global “deck type marketplace” like `DeckType` in `modularDecks`.

---

## 2) Preset deck types (DSA, System Design, etc.)

### `modularDecks`

There are two “typing systems” side-by-side:

- **Legacy**: `Deck.type` enum kept “for backward compatibility during migration” in `server/models/Deck.js`.
- **New**: `Deck.deckType` is an ObjectId ref to `DeckType`.

The “preset types” concept exists in `DeckType.isSystem = true`, but this branch does not include a clear seed/bootstrapping mechanism in the inspected code (it likely depended on DB seed data not in repo).

### `modular`

Preset deck types are implemented as **templates**, not DB entities.

- **Server template catalog**: `server/services/deckTemplateService.js` exports `DECK_TEMPLATES`
  - Includes templates for: `DSA`, `System Design`, `Behavioral`, `GRE-Word`, `GRE-MCQ` (and a `Custom` placeholder).
  - Each template contains **ordered fields** with `name`, `displayName`, `type`, `required`, `order`, and optional details like `language` and `placeholder`.
- **Client template catalog**: `client/src/utils/fieldTypes.js` mirrors the same `DECK_TEMPLATES` and field type catalog.

**How presets are applied**

- On deck creation (`server/controllers/deckController.js`):
  - If no `fieldConfig` is provided, it uses `getTemplate(type)` to build a default `fieldConfig`.
- On deck fetch (`GET /api/decks/:id`):
  - Server returns `resolvedFieldConfig` in the response by calling `resolveFieldConfig(deck)`.
  - `resolveFieldConfig` fills `fieldConfig.fields` from the template if `template !== 'Custom'` and `fields[]` is empty.

---

## 3) Rendering of decks / flashcards

### `modularDecks`

Rendering is driven by the `DeckType.fields[]` definitions:

- **Form rendering**: `client/src/components/flashcard/DynamicFlashcardForm.jsx`
  - Loads deck via `fetchDeckById(deckId)`; expects `deck.deckType.fields`.
  - Renders each field via `client/src/components/common/DynamicField.jsx`, which switches on:
    - `text`, `markdown`, `code`, `mcq`, `link`, `video`, `image`, `number`, `boolean`.
  - Saves modular data as `flashcard.fields` (object map).

### `modular`

Rendering is driven by `Deck.fieldConfig.fields[]` (or `resolvedFieldConfig.fields[]`).

- **Inputs** (create/edit flashcard):
  - `client/src/components/forms/DynamicFlashcardForm.jsx`
    - Renders inputs by field type via `FieldInput` abstraction (`client/src/components/field-inputs`).
    - Includes optional “Preview Mode” which renders via `FieldRenderer`.
- **Renderers** (study/view):
  - `client/src/components/field-renderers/index.js` maps types to components:
    - `plaintext`, `markdown`, `code`, `mcq`, `link`, `video`, `tags`.
  - Example consumption:
    - `client/src/components/study/ModularStudyCard.jsx` uses `FieldInput` in edit mode and `FieldRenderer` in view mode.

**Important field-type mismatch between branches**

- `modularDecks` field types: `text`, `markdown`, `code`, …
- `modular` field types: `plaintext`, `markdown`, `code`, `mcq`, `link`, `video`, `tags`

If we integrate, we’ll need to normalize naming (`text` vs `plaintext`) and feature parity (`image`, `number`, `boolean` exist in `modularDecks` but not in `modular`).

---

## 4) Card–deck relationship (and the “coupling” constraint)

### `modularDecks`: many-to-many (unsafe across differing schemas)

- `Flashcard.decks[]` is the primary association: `server/models/Flashcard.js`
- `Deck` explicitly states it does **not** store flashcard IDs; flashcards hold deck IDs.
- Controllers populate `decks` and nested `deckType`:
  - `server/controllers/flashcardController.js` uses `.populate({ path: 'decks', populate: { path: 'deckType', model: 'DeckType' } })`

**Consequence**

A flashcard could be attached to multiple decks with different `deckType.fields[]`. There’s no enforcement that the flashcard’s stored `fields` object is compatible with all attached decks.

### `modular`: introduces `primaryDeck` + schema validation by that deck

**Backend model**

- `server/models/Flashcard.js`
  - Adds `fieldData: Mixed` to store modular values as an object map.
  - Adds `primaryDeck: ObjectId` intended to represent the deck whose schema defines `fieldData`.
  - Keeps `decks[]` (array of deck ObjectIds) and the legacy fields (`question`, `explanation`, etc.) for backward compatibility.

**Backend behavior**

- `server/controllers/flashcardController.js` (create/update) when `fieldData` is present:
  - Picks the deck to validate against as:
    - `deckId = primaryDeck || (decks && decks[0])`
  - Loads deck, computes `fieldConfig = resolveFieldConfig(deck)`, and validates with `validateFieldData(fieldConfig, fieldData)`.
  - Persists:
    - `flashcard.fieldData = fieldData`
    - `flashcard.primaryDeck = deckId`
    - `flashcard.decks = decks || [deckId]`

**Frontend behavior**

- `client/src/components/flashcard/SmartFlashcardForm.jsx`
  - Loads a specific deck by `deckId` from URL params (or from the editing flashcard).
  - If the deck has `fieldConfig.fields[]`, it uses the modular `DynamicFlashcardForm` and submits:
    - `fieldData`
    - `primaryDeck = selectedDeck._id`
    - `decks = [selectedDeck._id]`
    - `type = selectedDeck.type`

**Consequence**

- Rendering becomes deterministic *as long as* the UI uses `primaryDeck` as the source of truth for which schema to use.
- However, since `decks[]` still exists, the system can drift back to many-to-many unless we enforce:
  - **invariant**: `flashcard.decks.length === 1` and equals `flashcard.primaryDeck`
  - or **invariant**: every deck in `flashcard.decks[]` must share the exact same field schema (hard to guarantee without schema hashing/versioning).

---

## 5) Data model for cards, decks, users (as implemented)

### Branch: `modularDecks`

**DeckType**

- `server/models/DeckType.js`
  - `fields[]`: schema for a deck type
  - `isSystem`, `isPublic`, `user`: controls who can see/use a type

**Deck**

- `server/models/Deck.js`
  - `deckType: ObjectId -> DeckType` (**required**)
  - `type: string enum` kept as legacy/back-compat
  - `user`, `isPublic`

**Flashcard**

- `server/models/Flashcard.js`
  - `fields: Mixed` (dynamic object keyed by field name)
  - `decks: ObjectId[] -> Deck`
  - legacy fields kept (`question`, `explanation`, etc.) + `metadata`

**User**

- `server/models/User.js` exists and is referenced by DeckType (`user`) and Deck/Flashcard (`user`).
  - No explicit “deck type ownership list” on the user; ownership is by `DeckType.user`.

### Branch: `modular`

**Deck**

- `server/models/Deck.js`
  - `type: enum` expanded to include `'Custom'`
  - `fieldConfig: { template, fields[], version, createdAt, updatedAt }`
    - field `type` enum: `plaintext`, `markdown`, `code`, `mcq`, `link`, `video`, `tags`
    - `order` must be unique; `name` must be unique (validated in `pre('save')`)
  - `resolvedFieldConfig` is computed in controller responses (not persisted) using `resolveFieldConfig`.

**Flashcard**

- `server/models/Flashcard.js`
  - legacy fields remain (`question`, `explanation`, `code`, etc.) + `metadata`
  - modular fields:
    - `fieldData: Mixed` object for modular content
    - `primaryDeck: ObjectId -> Deck` (the deck whose schema should be used to interpret/render `fieldData`)
  - still contains `decks[]` (historical design for many-to-many).

**User**

- `server/models/User.js` appears essentially unchanged in the modular typing work.
  - Users own decks and flashcards via `user: ObjectId`.

---

## Notes on migration support (present in `modular`)

`modular` includes scaffolding for migration and “mixed legacy/modular” operation:

- Server:
  - `server/services/deckTemplateService.js` includes `migrateLegacyFlashcard(...)` and `resolveFieldConfig(...)`
  - `server/controllers/deckController.js` and flashcard controller reference `autoMigrateOnAccess(...)` from `server/utils/migrationUtils.js`
  - `server/routes/migrationRoutes.js` exists (not detailed here), plus client pages in `client/src/components/migration/`
- Client:
  - `SmartFlashcardForm` decides whether to use the modular form based on whether the chosen deck has `fieldConfig.fields[]`.
  - Legacy `FlashcardForm` is retained as fallback.

---

## Practical integration takeaways (for planning)

If we integrate into current `master`, we’ll likely need to pick **one** of these approaches:

- **Approach A (DeckType entity)**: adopt the `modularDecks` model (`DeckType` collection) and require every deck to reference a DeckType.
  - Pros: reusable shared types; easy to browse/share a schema.
  - Cons: requires seeding/maintaining system types; migrations for existing decks; schema versioning issues when types change.
- **Approach B (Per-deck fieldConfig)**: adopt the `modular` model where the schema lives on each deck.
  - Pros: simplest path to “cards are coupled to a deck”; easiest to keep old preset decks unchanged by auto-resolving template fields.
  - Cons: less reuse; “custom type creation” is effectively “create a deck with a schema”, not “create a type”.

Regardless of A vs B, to address the coupling issue you raised we’ll need an explicit rule:

- Either **disallow multi-deck membership** for modular cards (enforce `primaryDeck` only), or
- Introduce a **schema identity** (hash/version) and only allow `Flashcard.decks[]` where every deck shares the same schema identity.