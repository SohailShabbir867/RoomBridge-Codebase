import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './redux/store';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/*
      Provider wraps everything — Redux store available to ALL components
      including SocketProvider (which reads auth state via useSelector).
      Toaster is inside Provider so it can access store if needed in future.
    */}
    <Provider store={store}>
      <App />
      {/*
        BUG FIX: Toaster is rendered as a sibling to App (not inside it)
        to avoid it being unmounted during route transitions.
        position="top-right" with containerStyle.top=80 clears the navbar.
        zIndex 9999 ensures toasts appear above modals.
      */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          top:    80,
          right:  16,
          zIndex: 9999,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily:   'Inter, sans-serif',
            fontSize:     '14px',
            fontWeight:   '500',
            borderRadius: '10px',
            boxShadow:    '0 4px 16px rgba(0,0,0,0.12)',
            maxWidth:     '380px',
          },
          success: {
            duration: 3000,
            style: {
              background: '#f0fdf4',
              color:      '#166534',
              border:     '1px solid #bbf7d0',
            },
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            duration: 5000,
            style: {
              background: '#fff1f2',
              color:      '#9f1239',
              border:     '1px solid #fecdd3',
            },
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
          loading: {
            style: {
              background: '#eff6ff',
              color:      '#1e40af',
              border:     '1px solid #bfdbfe',
            },
          },
        }}
      />
    </Provider>
  </React.StrictMode>
);
