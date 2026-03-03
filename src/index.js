import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * ARCHIVO DE ENTRADA (LANZADOR)
 * Este archivo conecta el componente App.js con el div "root" de index.html.
 * Se ha verificado que no existan caracteres invisibles que causen errores en Vercel.
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("No se encontró el elemento con id 'root'. Asegúrate de que public/index.html lo incluya.");
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
