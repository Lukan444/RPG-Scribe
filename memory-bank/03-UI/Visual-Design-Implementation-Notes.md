# Visual Design Implementation Notes

## Overview

This document provides implementation notes for the visual design of the RPG Archivist application, based on the visual references provided. It outlines the key design elements, color palette, and component styling to ensure a consistent and visually appealing user interface.

## Key Visual Elements

The RPG Archivist application follows a dark-themed, sci-fi/fantasy aesthetic with the following key visual elements:

1. **Dark Background**: Deep dark blue/black (#0D1117) as the primary background color
2. **Teal Accents**: Teal/turquoise (#1A9B9B) as the primary accent color for interactive elements
3. **Glowing Effects**: Subtle glow effects on interactive elements and visualizations
4. **Card-Based Layout**: Clean, dark panels with subtle borders for content organization
5. **Information Density**: Balanced approach with clear statistics and concise information
6. **Consistent Typography**: Clean, modern sans-serif font for most text with a slightly stylized serif font for the app title

## Color Palette Implementation

```js
// In tailwind.config.js
theme.extend.colors = { 
  surface: {
    DEFAULT: '#0D1117',
    light: '#1A2233'
  },
  accent: {
    DEFAULT: '#1A9B9B',
    light: '#2CCACA',
    dark: '#0E7A7A'
  },
  secondary: '#F6AD55',
  text: {
    primary: '#FFFFFF',
    secondary: '#A0AEC0'
  },
  success: '#48BB78',
  warning: '#F6AD55',
  error: '#F56565',
  glow: 'var(--tw-shadow-color)' 
}
```

## Component Styling

### Cards and Panels

Cards and panels should have the following styling:

```jsx
<div className="bg-surface-light rounded-lg border border-accent/20 p-6 shadow-lg">
  {/* Card content */}
</div>
```

### Interactive Elements

Buttons and interactive elements should have the following styling:

```jsx
// Primary button
<button className="bg-accent hover:bg-accent-light text-white rounded px-4 py-2 transition-colors">
  Button Text
</button>

// Secondary button
<button className="bg-surface-light text-accent hover:bg-accent/10 border border-accent/20 rounded px-4 py-2 transition-colors">
  Button Text
</button>

// Icon button
<button className="p-2 rounded bg-surface-light text-accent hover:bg-accent/10 transition-colors">
  <Icon size={16} />
</button>
```

### Glow Effects

Glow effects should be implemented using box-shadows:

```jsx
// Glow effect on hover
<div className="hover:shadow-[0_0_15px_rgba(26,155,155,0.5)] transition-shadow">
  {/* Content */}
</div>

// Permanent glow effect
<div className="shadow-[0_0_15px_rgba(26,155,155,0.5)]">
  {/* Content */}
</div>
```

### Typography

Typography should follow these guidelines:

```jsx
// Headings
<h1 className="text-2xl font-bold text-text-primary">Heading</h1>

// Subheadings
<h2 className="text-xl font-bold text-text-primary">Subheading</h2>

// Body text
<p className="text-text-secondary">Body text</p>

// Labels
<span className="text-xs text-text-secondary">Label</span>
```

## Screen-Specific Styling

### Dashboard

The Dashboard should feature a clean, card-based layout with key statistics and quick links:

- Campaign Overview Card with large, easy-to-read numbers
- Quick Links Card with icon + text format
- World Map Card with teal/turquoise outline map
- Recent Sessions Table with clean tabular format

### Mind Map

The Mind Map should feature a dark background with glowing teal/turquoise nodes and connections:

- Hexagonal nodes with entity icons and labels
- Glowing aura around nodes based on entity type
- Curved, glowing lines showing relationships
- Quick action buttons for selected nodes

### Timeline

The Timeline should feature a horizontal, scrollable timeline with glowing markers and session pills:

- Timeline axis with date markers
- Session pills as elongated, rounded rectangles
- Event markers as glowing dots or icons
- Clear date/time indicators along the timeline

### Transcripts Manager

The Transcripts Manager should feature a clean, two-panel layout:

- Transcript list with status indicators
- Color-coded speaker tags with character portraits
- Timestamp markers for time progression
- AI-detected highlights with glowing indicators

### Image Library

The Image Library should feature a responsive grid layout of image cards:

- Thumbnail previews with entity association indicators
- Quick-view overlay with actions on hover
- Filtering system for organization
- Clean, modern upload interface

## Implementation Guidelines

1. **Consistency**: Maintain consistent styling across all components
2. **Responsiveness**: Ensure all components adapt to different screen sizes
3. **Accessibility**: Ensure sufficient contrast for text readability
4. **Performance**: Optimize glow effects and animations for performance
5. **Theming**: Implement the styling through a theme provider for easy updates

## Next Steps

1. Implement the Tailwind configuration with the color palette
2. Create base component styles for cards, buttons, and typography
3. Implement the glow effects for interactive elements
4. Apply the styling to the Dashboard components
5. Apply the styling to the Mind Map visualization
6. Apply the styling to the Timeline visualization
7. Apply the styling to the Transcripts Manager
8. Apply the styling to the Image Library
9. Test the styling across different screen sizes
10. Refine and adjust as needed based on user feedback
