//import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store.ts';
import './index.css';
import App from './App.tsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID =
  '1036034902450-21b13t9dj3cgjttqt1t9akb06roappvu.apps.googleusercontent.com';

createRoot(document.getElementById('root')!).render(
  //<StrictMode>
  <Provider store={store}>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </BrowserRouter>
  </Provider>,
  //</StrictMode>,
);
