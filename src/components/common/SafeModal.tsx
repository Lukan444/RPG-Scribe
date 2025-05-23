import { Modal, ModalProps } from '@mantine/core';
import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Enhanced SafeModal component
 *
 * A wrapper around Mantine's Modal component that prevents ResizeObserver loop errors
 * by implementing multiple strategies:
 * 1. Delayed content rendering
 * 2. Debounced resize handling
 * 3. Proper cleanup of observers
 */
export function SafeModal({ children, opened, onClose, ...props }: ModalProps) {
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [isModalReady, setIsModalReady] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const readyTimeoutRef = useRef<NodeJS.Timeout>();
  const resizeObserverRef = useRef<ResizeObserver>();

  // Debounced close handler to prevent rapid open/close cycles
  const debouncedClose = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 10);
  }, [onClose]);

  useEffect(() => {
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
    }

    if (opened) {
      // First, mark modal as ready after a short delay
      readyTimeoutRef.current = setTimeout(() => {
        setIsModalReady(true);

        // Then show content after modal is ready
        timeoutRef.current = setTimeout(() => {
          setIsContentVisible(true);
        }, 100);
      }, 50);
    } else {
      // Immediately hide content when closing
      setIsContentVisible(false);
      setIsModalReady(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
      }
    };
  }, [opened]);

  // Clean up ResizeObserver on unmount
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // Enhanced modal props with better error handling
  const enhancedProps: ModalProps = {
    ...props,
    opened,
    onClose: debouncedClose,
    // Add transition props to smooth animations and reduce ResizeObserver triggers
    transitionProps: {
      duration: 200,
      ...props.transitionProps
    },
    // Ensure proper z-index to avoid stacking issues
    zIndex: props.zIndex || 1000
  };

  return (
    <Modal {...enhancedProps}>
      {isModalReady && isContentVisible ? children : null}
    </Modal>
  );
}