import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderWithMantine, screen } from '../vitest-utils/test-utils';
import RelationshipPreview from '../../components/relationships/RelationshipPreview';

const relationships = [
  {
    id: 'r1',
    source: { id: 'c1', name: 'Hero', type: 'CHARACTER' },
    target: { id: 'c2', name: 'Villain', type: 'CHARACTER' },
    type: 'ally',
    subtype: 'friend'
  }
] as any;

describe('RelationshipPreview', () => {
  it('renders related entity names', () => {
    renderWithMantine(
      <RelationshipPreview relationships={relationships} entityId="c1" />
    );
    expect(screen.getByText('Villain')).toBeInTheDocument();
  });
});
