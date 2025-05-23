import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
// Import ResizeObserver polyfill FIRST to prevent errors
import './utils/resizeObserverPolyfill';
import { MantineProvider, createTheme, Loader, Center } from '@mantine/core';
import { theme } from './theme/theme';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';

// Import i18n configuration
import './i18n/config';

// Import Mantine styles
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/spotlight/styles.css';

// Import application styles
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
// Temporarily disable React.StrictMode to test ResizeObserver error fix
// React.StrictMode causes double-rendering which can trigger ResizeObserver loops
const StrictModeWrapper = process.env.NODE_ENV === 'development' ?
  React.Fragment : React.StrictMode;

root.render(
  <StrictModeWrapper>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <ModalsProvider>
        <Notifications />
        <Suspense fallback={
          <Center style={{ width: '100vw', height: '100vh' }}>
            <Loader size="xl" />
          </Center>
        }>
          <App />
        </Suspense>
      </ModalsProvider>
    </MantineProvider>
  </StrictModeWrapper>
);
