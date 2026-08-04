import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PersonAvatar } from '@/components/people/PersonAvatar';

// Radix's AvatarImage only swaps in once the image "loads", which never
// resolves synchronously in jsdom - so these tests stick to the no-avatar
// path, where only the initials fallback ever renders.
describe('PersonAvatar', () => {
  it('shows two-letter initials for a two-word name', () => {
    render(<PersonAvatar avatar={null} displayName="Alice Wonderland" />);
    expect(screen.getByText('AW')).toBeInTheDocument();
  });

  it('shows a single initial for a one-word name', () => {
    render(<PersonAvatar avatar={null} displayName="Charlie" />);
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('only uses the first two words for a long name', () => {
    render(<PersonAvatar avatar={null} displayName="Mary Jane Watson" />);
    expect(screen.getByText('MJ')).toBeInTheDocument();
  });

  it('falls back to "?" for an empty name', () => {
    render(<PersonAvatar avatar={null} displayName="" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });
});
