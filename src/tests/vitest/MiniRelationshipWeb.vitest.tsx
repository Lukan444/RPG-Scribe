import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderWithMantine, screen } from '../vitest-utils/test-utils';
import MiniRelationshipWeb from '../../components/relationships/visualizations/MiniRelationshipWeb';

const nodes = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' }
];
const links = [{ source: 'a', target: 'b' }];

describe('MiniRelationshipWeb', () => {
  it('renders an SVG graph', () => {
    renderWithMantine(
      <MiniRelationshipWeb nodes={nodes} links={links} width={200} height={200} />
    );
    expect(screen.getByLabelText('Mini Relationship Web')).toBeInTheDocument();
  });
});
