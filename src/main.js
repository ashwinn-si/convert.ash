// ═══════════════════════════════════════════════════════
// OmniConvert – Entry Point
// ═══════════════════════════════════════════════════════

import './style.css';
import { initApp } from './app.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// Also init immediately if DOM is already ready
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initApp();
}
