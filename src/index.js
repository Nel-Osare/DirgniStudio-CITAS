import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Este archivo es el punto de entrada que conecta el componente App
// con el elemento 'root' definido en tu archivo public/index.html
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
