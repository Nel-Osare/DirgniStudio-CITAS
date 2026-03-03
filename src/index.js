import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Este archivo conecta el código de React con el div "root" de tu HTML
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
