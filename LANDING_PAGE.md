# DevDecks Landing Page

## Overview

A modern, attractive landing page showcasing all DevDecks features. Built with React, Tailwind CSS, and shadcn/ui components.

## Access

**Current URL**: `/landing`

**Future**: Will replace the home page (`/`) after testing

## Features Highlighted

### Hero Section
- Eye-catching gradient title
- Call-to-action buttons
- Key statistics (6+ card types, 15+ decks, 1000+ problems, 300+ words)
- Card type badges

### Main Features (6 Cards)
1. **EOD Revision** - Review cards from last 24 hours
2. **Study Mode with Videos** - Embedded YouTube videos with notes
3. **YouTube Playlist Import** - Auto-create decks from playlists
4. **User Profiles & Tracking** - Track progress and favorites
5. **Advanced Search & Filtering** - Powerful search capabilities
6. **Dark Mode** - Easy on the eyes

### DSA Features Section
- Comprehensive Problem List (1000+ problems)
- Multi-Language Support (Python, Java, C++, JavaScript)
- Smart Categorization with tags

### GRE Features Section
- Pre-built GRE Decks (10+ decks, 300+ words)
- Dictionary Integration (Merriam-Webster API)
- Vocabulary Builder (Auto-create flashcards)

### Additional Features
- Testing Mode
- Public/Private Decks
- Favorites System
- Code Snippets with syntax highlighting
- Progress Tracking
- Mobile Friendly

### Components Used
- **shadcn/ui**: Button, Card, Badge components
- **Heroicons**: For all icons
- **Tailwind CSS**: For styling and animations
- **React Router**: For navigation

## Design Features

### Colors
- **Primary**: Indigo (600) and Purple (600)
- **Gradients**: Blue → Indigo → Purple
- **Dark Mode**: Full support with CSS variables

### Animations
- Hover effects on cards
- Smooth transitions
- Gradient text effects
- Shadow elevations

### Responsive
- Mobile-first design
- Grid layouts adapt to screen size
- Collapsible navigation on mobile

## How to Test

1. Start the development server:
```bash
cd client
npm start
```

2. Navigate to: `http://localhost:3000/landing`

3. Test features:
   - Click "Get Started Free" → Goes to `/home`
   - Click "Explore Problems" → Goes to `/problem-list`
   - Toggle dark mode
   - Test responsive design (resize browser)
   - Click footer links

## Migration Plan

### Phase 1: Testing (Week 1)
- Access via `/landing`
- Gather feedback
- Make adjustments
- Test on different devices

### Phase 2: Soft Launch (Week 2)
- Add link from current home page
- Monitor analytics
- A/B test if possible

### Phase 3: Full Launch (Week 3)
- Replace `/` route with LandingPage
- Move old Hero to `/old-home` (backup)
- Update all internal links

## Customization

### Update Stats
Edit the `stats` array in `LandingPage.jsx`:

```javascript
const stats = [
  { label: 'Flashcard Types', value: '6+' },
  { label: 'Pre-built Decks', value: '15+' },
  // Add more...
];
```

### Add Features
Edit the `features` array:

```javascript
{
  icon: YourIcon,
  title: 'Feature Name',
  description: 'Feature description',
  color: 'text-color-class',
  bgColor: 'bg-color-class'
}
```

### Change Colors
Update CSS variables in `client/src/index.css`:

```css
:root {
  --primary: 221.2 83.2% 53.3%; /* Indigo */
  /* Change to your brand color */
}
```

## Dependencies

All dependencies are already installed:
- `@heroicons/react` - Icons
- `react-router-dom` - Routing
- `tailwindcss` - Styling
- `class-variance-authority` - Button variants
- `clsx` & `tailwind-merge` - Class merging

## SEO Considerations

When moving to production:

1. Add meta tags in `public/index.html`:
```html
<meta name="description" content="Master CS interviews with DevDecks - intelligent flashcards for DSA, System Design, and GRE prep">
<meta property="og:title" content="DevDecks - Master Technical Interviews">
<meta property="og:description" content="All-in-one platform for CS students">
```

2. Add JSON-LD structured data
3. Optimize images (add loading="lazy")
4. Add sitemap.xml

## Analytics Integration

Add Google Analytics or similar:

```javascript
// In LandingPage.jsx
useEffect(() => {
  // Track page view
  window.gtag('event', 'page_view', {
    page_path: '/landing',
  });
}, []);
```

## Performance

- All images are icons (no heavy images)
- CSS-only animations
- Lazy loading for routes
- Minimal JavaScript

Expected Lighthouse scores:
- Performance: 95+
- Accessibility: 90+
- Best Practices: 95+
- SEO: 90+

## Future Enhancements

- [ ] Add testimonials section
- [ ] Add demo video/GIF
- [ ] Add pricing section (if monetizing)
- [ ] Add blog posts preview
- [ ] Add social proof (user count, GitHub stars)
- [ ] Add feature comparison table
- [ ] Add FAQ section
- [ ] Add newsletter signup

