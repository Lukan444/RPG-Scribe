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
