import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

let root: Root | undefined;

export function render(component: React.ReactNode): void {
  const container = document.getElementById('root');
  if (!container) return;
  if (!root) root = createRoot(container);
  root.render(<React.StrictMode>{component}</React.StrictMode>);
}
