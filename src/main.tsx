import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { applyColorScheme, loadSavedScheme } from './store/colorScheme';

// Apply saved color scheme immediately before render
applyColorScheme(loadSavedScheme());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
