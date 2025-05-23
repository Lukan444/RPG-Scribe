# Styling Migration Guide: Material UI to Mantine

## Overview

This document provides a comprehensive guide for migrating styles from Material UI to Mantine in the RPG Archivist application. Mantine v8 uses a different approach to styling compared to Material UI, focusing on CSS modules and CSS variables instead of the styled-components approach.

## Key Differences

### Material UI Styling Approach

Material UI uses a JSS-based styling solution with the following characteristics:

- Styles are defined in JavaScript/TypeScript
- Uses the `makeStyles`, `styled`, or `sx` prop for styling
- Theme is accessed through a theme object in JavaScript
- Styles are scoped to components using class name generation

### Mantine Styling Approach

Mantine v8 uses a CSS-first approach with the following characteristics:

- Styles are defined in CSS/SCSS files
- Uses CSS modules for component-specific styles
- Theme values are accessed through CSS variables
- Styles are scoped to components using CSS modules

## Setup Requirements

### PostCSS Configuration

```js
// postcss.config.cjs
module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};
```

### Required Dependencies

```bash
npm install postcss postcss-preset-mantine postcss-simple-vars
```

### Core Styles Import

```tsx
// src/index.tsx
import '@mantine/core/styles.css';
```

## Migration Patterns

### 1. From makeStyles to CSS Modules

#### Material UI (Before)

```tsx
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
  },
  title: {
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(1),
  },
}));

function MyComponent() {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <h2 className={classes.title}>Title</h2>
    </div>
  );
}
```

#### Mantine (After)

```css
/* MyComponent.module.css */
.root {
  background-color: var(--mantine-color-white);
  padding: var(--mantine-spacing-md);
  border-radius: var(--mantine-radius-md);
}

.title {
  color: var(--mantine-color-teal-6);
  margin-bottom: var(--mantine-spacing-xs);
}

/* Dark mode styles */
@mixin dark {
  .root {
    background-color: var(--mantine-color-dark-6);
  }
}
```

```tsx
// MyComponent.tsx
import classes from './MyComponent.module.css';

function MyComponent() {
  return (
    <div className={classes.root}>
      <h2 className={classes.title}>Title</h2>
    </div>
  );
}
```

### 2. From sx Prop to className

#### Material UI (Before)

```tsx
import { Box, Typography } from '@material-ui/core';

function MyComponent() {
  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        padding: 2,
        borderRadius: 1,
      }}
    >
      <Typography
        sx={{
          color: 'primary.main',
          marginBottom: 1,
        }}
      >
        Title
      </Typography>
    </Box>
  );
}
```

#### Mantine (After)

```css
/* MyComponent.module.css */
.container {
  background-color: var(--mantine-color-white);
  padding: var(--mantine-spacing-md);
  border-radius: var(--mantine-radius-md);
}

.title {
  color: var(--mantine-color-teal-6);
  margin-bottom: var(--mantine-spacing-xs);
}

/* Dark mode styles */
@mixin dark {
  .container {
    background-color: var(--mantine-color-dark-6);
  }
}
```

```tsx
// MyComponent.tsx
import { Box, Text } from '@mantine/core';
import classes from './MyComponent.module.css';

function MyComponent() {
  return (
    <Box className={classes.container}>
      <Text className={classes.title}>Title</Text>
    </Box>
  );
}
```

### 3. From Theme Object to CSS Variables

#### Material UI (Before)

```tsx
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.mode === 'dark' 
      ? theme.palette.grey[900] 
      : theme.palette.grey[100],
    color: theme.palette.mode === 'dark'
      ? theme.palette.common.white
      : theme.palette.common.black,
  },
}));
```

#### Mantine (After)

```css
/* Component.module.css */
.root {
  background-color: light-dark(
    var(--mantine-color-gray-1),
    var(--mantine-color-dark-6)
  );
  color: light-dark(
    var(--mantine-color-black),
    var(--mantine-color-white)
  );
}

/* Alternative using mixins */
.root {
  background-color: var(--mantine-color-gray-1);
  color: var(--mantine-color-black);

  @mixin dark {
    background-color: var(--mantine-color-dark-6);
    color: var(--mantine-color-white);
  }
}
```

### 4. From Global Styles to CSS File

#### Material UI (Before)

```tsx
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Roboto', sans-serif;
    background-color: ${props => props.theme.palette.background.default};
    color: ${props => props.theme.palette.text.primary};
  }
`;

function App() {
  return (
    <>
      <GlobalStyle />
      {/* App content */}
    </>
  );
}
```

#### Mantine (After)

```css
/* src/index.css */
body {
  margin: 0;
  padding: 0;
  font-family: var(--mantine-font-family);
  background-color: light-dark(
    var(--mantine-color-white),
    var(--mantine-color-dark-7)
  );
  color: light-dark(
    var(--mantine-color-black),
    var(--mantine-color-white)
  );
}
```

```tsx
// src/index.tsx
import '@mantine/core/styles.css';
import './index.css';
```

## Theme Configuration

### Material UI Theme (Before)

```tsx
import { createTheme } from '@material-ui/core/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1A9B9B', // teal
    },
    secondary: {
      main: '#F6AD55', // amber
    },
    background: {
      default: '#0D1117',
      paper: '#1A2233',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A0AEC0',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: {
      fontWeight: 700,
    },
    // ...other typography settings
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
});
```

### Mantine Theme (After)

```tsx
// src/theme/theme.ts
import { createTheme, MantineColorsTuple } from '@mantine/core';

// Primary accent: Teal/turquoise
const teal: MantineColorsTuple = [
  '#e6fcfc', // 0
  '#d0f7f7', // 1
  '#a3efef', // 2
  '#71e7e7', // 3
  '#4ce0e0', // 4
  '#35dcdc', // 5
  '#1A9B9B', // 6 - Primary
  '#0e7a7a', // 7
  '#006666', // 8
  '#004d4d'  // 9
];

// Secondary accent: Gold/amber
const amber: MantineColorsTuple = [
  '#fff8e1', // 0
  '#ffecb3', // 1
  '#ffe082', // 2
  '#ffd54f', // 3
  '#ffca28', // 4
  '#ffc107', // 5
  '#F6AD55', // 6 - Secondary
  '#ff8f00', // 7
  '#ff6f00', // 8
  '#ff5722'  // 9
];

export const theme = createTheme({
  colors: {
    teal,
    amber,
  },
  primaryColor: 'teal',
  primaryShade: 6,
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: '700',
  },
  radius: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '32px',
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
        withBorder: true,
      },
    },
  },
  other: {
    surface: {
      DEFAULT: '#0D1117',
      light: '#1A2233'
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A0AEC0'
    },
    success: '#48BB78',
    warning: '#F6AD55',
    error: '#F56565',
  }
});
```

## Component-Specific Styling

### 1. Button Styling

#### Material UI (Before)

```tsx
import { Button, makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  button: {
    borderRadius: 20,
    padding: '8px 24px',
    textTransform: 'none',
    fontWeight: 600,
  },
}));

function MyButton() {
  const classes = useStyles();
  return (
    <Button 
      variant="contained" 
      color="primary" 
      className={classes.button}
    >
      Click Me
    </Button>
  );
}
```

#### Mantine (After)

```css
/* MyButton.module.css */
.button {
  border-radius: 20px;
  padding: 8px 24px;
  font-weight: 600;
}
```

```tsx
// MyButton.tsx
import { Button } from '@mantine/core';
import classes from './MyButton.module.css';

function MyButton() {
  return (
    <Button 
      className={classes.button}
      color="teal"
    >
      Click Me
    </Button>
  );
}
```

### 2. Card Styling

#### Material UI (Before)

```tsx
import { Card, CardContent, Typography, makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  card: {
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: theme.shadows[2],
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: theme.shadows[4],
    },
  },
  content: {
    padding: theme.spacing(3),
  },
}));

function MyCard() {
  const classes = useStyles();
  return (
    <Card className={classes.card}>
      <CardContent className={classes.content}>
        <Typography variant="h5">Card Title</Typography>
        <Typography variant="body1">Card content</Typography>
      </CardContent>
    </Card>
  );
}
```

#### Mantine (After)

```css
/* MyCard.module.css */
.card {
  border-radius: calc(var(--mantine-radius-md) * 2);
  box-shadow: var(--mantine-shadow-sm);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: var(--mantine-shadow-md);
}

.content {
  padding: var(--mantine-spacing-lg);
}
```

```tsx
// MyCard.tsx
import { Card, Text, Title } from '@mantine/core';
import classes from './MyCard.module.css';

function MyCard() {
  return (
    <Card className={classes.card}>
      <Card.Section className={classes.content}>
        <Title order={5}>Card Title</Title>
        <Text>Card content</Text>
      </Card.Section>
    </Card>
  );
}
```

## Conclusion

This styling migration guide provides a comprehensive approach for transitioning from Material UI's styling system to Mantine's CSS-first approach. By following these patterns and examples, developers can ensure a consistent and maintainable styling system throughout the RPG Archivist application.
