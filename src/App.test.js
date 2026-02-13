import { render, screen } from '@testing-library/react';
import App from './App';

test('renders FutureForge brand', () => {
  render(<App />);
  const brandElement = screen.getByText(/FutureForge/i);
  expect(brandElement).toBeInTheDocument();
});
