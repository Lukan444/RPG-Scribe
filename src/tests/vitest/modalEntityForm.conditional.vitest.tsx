import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithMantine } from '../../tests/vitest-utils/test-utils';
import { ModalEntityForm } from '../../components/forms/ModalEntityForm';
import { EntityType } from '../../types/forms';

// Helper to render with required props
const setup = (role: 'admin' | 'gamemaster' | 'player' | 'user') => {
  renderWithMantine(
    <ModalEntityForm
      entityType={EntityType.FACTION}
      opened={true}
      onClose={() => {}}
      worldId="world1"
      userRole={role}
    />
  );
};

describe('ModalEntityForm role-based conditionals', () => {
  it('hides GM-only tab and fields for non-GM users', () => {
    setup('player');
    expect(screen.queryByText('GM Secrets')).not.toBeInTheDocument();
    expect(screen.queryByText('Secret Notes (GM Only)')).not.toBeInTheDocument();
  });

  it('shows GM-only tab for gamemaster', () => {
    setup('gamemaster');
    expect(screen.getByText('GM Secrets')).toBeInTheDocument();
  });
});
