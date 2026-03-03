import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * ARCHIVO DE ENTRADA (LANZADOR)
 * Este archivo conecta el componente App.js con el div "root" de index.html
 */
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
