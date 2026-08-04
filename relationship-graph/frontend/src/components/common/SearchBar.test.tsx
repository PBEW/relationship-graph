import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SearchBar } from '@/components/common/SearchBar';

// SearchBar is a controlled input - drive it through a small stateful
// wrapper so typing behaves like it would for a real caller (React resets a
// controlled input's DOM value back to the unchanged `value` prop after
// every keystroke if the caller doesn't feed the new value back in).
function ControlledSearchBar({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <SearchBar
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
    />
  );
}

describe('SearchBar', () => {
  it('renders the current value and placeholder', () => {
    render(<SearchBar value="alice" onChange={() => {}} placeholder="Search graph..." />);
    expect(screen.getByPlaceholderText('Search graph...')).toHaveValue('alice');
  });

  it('calls onChange as the user types, accumulating the typed value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledSearchBar onChange={onChange} />);

    await user.type(screen.getByRole('textbox'), 'bob');

    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenLastCalledWith('bob');
    expect(screen.getByRole('textbox')).toHaveValue('bob');
  });

  it('does not show a clear button when empty', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('clears the value when the clear button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchBar value="something" onChange={onChange} />);

    await user.click(screen.getByLabelText('Clear search'));

    expect(onChange).toHaveBeenCalledWith('');
  });
});
