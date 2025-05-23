/**
 * Mantine Component Tests using Vitest
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Text, Button, Group, Card, Badge, Stack } from '@mantine/core';
import { renderWithMantine } from '../../tests/vitest-utils/test-utils';
import { IconCheck } from '@tabler/icons-react';

describe('Mantine Components', () => {
  describe('Text Component', () => {
    it('renders a Mantine Text component', () => {
      renderWithMantine(<Text>Mantine Text</Text>);
      expect(screen.getByText('Mantine Text')).toBeInTheDocument();
    });

    it('renders Text with different sizes', () => {
      renderWithMantine(
        <Stack>
          <Text size="xs" data-testid="xs-text">Extra Small</Text>
          <Text size="sm" data-testid="sm-text">Small</Text>
          <Text size="md" data-testid="md-text">Medium</Text>
          <Text size="lg" data-testid="lg-text">Large</Text>
          <Text size="xl" data-testid="xl-text">Extra Large</Text>
        </Stack>
      );

      expect(screen.getByTestId('xs-text')).toHaveTextContent('Extra Small');
      expect(screen.getByTestId('sm-text')).toHaveTextContent('Small');
      expect(screen.getByTestId('md-text')).toHaveTextContent('Medium');
      expect(screen.getByTestId('lg-text')).toHaveTextContent('Large');
      expect(screen.getByTestId('xl-text')).toHaveTextContent('Extra Large');
    });

    it('renders Text with different weights', () => {
      renderWithMantine(
        <Stack>
          <Text fw={400} data-testid="normal-text">Normal</Text>
          <Text fw={500} data-testid="medium-text">Medium</Text>
          <Text fw={700} data-testid="bold-text">Bold</Text>
        </Stack>
      );

      expect(screen.getByTestId('normal-text')).toHaveTextContent('Normal');
      expect(screen.getByTestId('medium-text')).toHaveTextContent('Medium');
      expect(screen.getByTestId('bold-text')).toHaveTextContent('Bold');
    });
  });

  describe('Button Component', () => {
    it('renders a Mantine Button component', () => {
      renderWithMantine(<Button>Click Me</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Click Me');
    });

    it('renders Button with different variants', () => {
      renderWithMantine(
        <Group>
          <Button variant="filled" data-testid="filled-button">Filled</Button>
          <Button variant="outline" data-testid="outline-button">Outline</Button>
          <Button variant="light" data-testid="light-button">Light</Button>
          <Button variant="subtle" data-testid="subtle-button">Subtle</Button>
        </Group>
      );

      expect(screen.getByTestId('filled-button')).toHaveTextContent('Filled');
      expect(screen.getByTestId('outline-button')).toHaveTextContent('Outline');
      expect(screen.getByTestId('light-button')).toHaveTextContent('Light');
      expect(screen.getByTestId('subtle-button')).toHaveTextContent('Subtle');
    });

    it('renders Button with icon', () => {
      renderWithMantine(
        <Button leftSection={<IconCheck data-testid="check-icon" />}>
          With Icon
        </Button>
      );

      expect(screen.getByRole('button')).toHaveTextContent('With Icon');
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('renders disabled Button', () => {
      renderWithMantine(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Card Component', () => {
    it('renders a Mantine Card component', () => {
      renderWithMantine(
        <Card data-testid="test-card">
          <Card.Section data-testid="card-section">
            <Text>Card Section</Text>
          </Card.Section>
          <Text>Card Content</Text>
        </Card>
      );

      expect(screen.getByTestId('test-card')).toBeInTheDocument();
      expect(screen.getByTestId('card-section')).toBeInTheDocument();
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });
  });

  describe('Badge Component', () => {
    it('renders a Mantine Badge component', () => {
      renderWithMantine(<Badge>New</Badge>);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('renders Badge with different variants', () => {
      renderWithMantine(
        <Group>
          <Badge variant="filled" data-testid="filled-badge">Filled</Badge>
          <Badge variant="outline" data-testid="outline-badge">Outline</Badge>
          <Badge variant="light" data-testid="light-badge">Light</Badge>
        </Group>
      );

      expect(screen.getByTestId('filled-badge')).toHaveTextContent('Filled');
      expect(screen.getByTestId('outline-badge')).toHaveTextContent('Outline');
      expect(screen.getByTestId('light-badge')).toHaveTextContent('Light');
    });
  });

  describe('Group Component', () => {
    it('renders a Mantine Group component', () => {
      renderWithMantine(
        <Group data-testid="test-group">
          <Button>Button 1</Button>
          <Button>Button 2</Button>
          <Button>Button 3</Button>
        </Group>
      );

      expect(screen.getByTestId('test-group')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });
  });

  describe('Stack Component', () => {
    it('renders a Mantine Stack component', () => {
      renderWithMantine(
        <Stack data-testid="test-stack">
          <Text>Item 1</Text>
          <Text>Item 2</Text>
          <Text>Item 3</Text>
        </Stack>
      );

      expect(screen.getByTestId('test-stack')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });
  });
});
