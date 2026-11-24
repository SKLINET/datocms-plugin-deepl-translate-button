import React from 'react';
import { createRoot } from 'react-dom/client';

export function render(component: React.ReactNode): void {
  const root = document.getElementById('root');
  if (!root) return;
  createRoot(root).render(<React.StrictMode>{component}</React.StrictMode>);
}
