// src/main.jsx
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import Home from './pages/Home';
import TestEthCommands from './pages/TestEthCommands';
import './i18n';
import LedgerBridge from './ledger-bridge';

const bridge = new LedgerBridge();

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/test-eth-commands',
        element: <TestEthCommands />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <Suspense fallback="Loading...">
        <RouterProvider router={router} />
      </Suspense>
    </Provider>
  </React.StrictMode>,
);
