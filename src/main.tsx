// Polyfill localStorage if it is blocked or throws in a sandboxed iframe context
try {
  const testKey = '__storage_test__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
} catch (e) {
  console.warn("localStorage is not accessible (likely due to iframe sandbox restrictions). Falling back to in-memory storage.");
  const storage: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: (key: string) => (key in storage ? storage[key] : null),
    setItem: (key: string, value: string) => { storage[key] = String(value); },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
    key: (index: number) => Object.keys(storage)[index] || null,
    get length() { return Object.keys(storage).length; }
  };
  try {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });
  } catch (err) {
    // If we can't redefine it directly on window, assign it as a global fallback helper
    (window as any).localStorage = mockLocalStorage;
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
