import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { applyColorScheme, loadSavedScheme, applyDarkMode, isDarkModeEnabled } from './store/colorScheme';

// Apply saved color scheme and dark mode immediately before render (no flash)
applyColorScheme(loadSavedScheme());
applyDarkMode(isDarkModeEnabled());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
