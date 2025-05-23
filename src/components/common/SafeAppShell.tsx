import { AppShell, AppShellProps } from '@mantine/core';
import { useEffect, useState } from 'react';

/**
 * SafeAppShell component
 *
 * A wrapper around Mantine's AppShell component that prevents ResizeObserver loop errors
 * by using a more controlled rendering approach.
 */
function SafeAppShellComponent({ children, ...props }: AppShellProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Delay full initialization to avoid ResizeObserver loop errors
    const timeoutId = setTimeout(() => {
      setIsReady(true);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Apply a stable width/height initially to prevent rapid resize events
  const initialStyle = isReady ? {} : {
    minHeight: '100vh',
    width: '100%',
    overflow: 'hidden'
  };

  return (
    <div style={initialStyle}>
      <AppShell {...props}>
        {children}
      </AppShell>
    </div>
  );
}

// Export SafeAppShell with all AppShell sub-components
export const SafeAppShell = Object.assign(SafeAppShellComponent, {
  Header: AppShell.Header,
  Navbar: AppShell.Navbar,
  Main: AppShell.Main,
  Footer: AppShell.Footer,
  Aside: AppShell.Aside,
});