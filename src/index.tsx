import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Auth0Provider } from '@auth0/auth0-react';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={process.env.REACT_APP_ENV === 'DEV' ? 'dev-chzmnpn7nce0kql2.us.auth0.com' : 'shrimp-jam.us.auth0.com'}
      clientId={process.env.REACT_APP_ENV === 'DEV' ? 'B3tUQtY82uU0skTLd7VAPyLaKV57bH78' : 'PJZRluG8BA41SdAcMapnUqlHkc1kSERp'}
      cacheLocation="localstorage"
      authorizationParams={{
        redirect_uri: process.env.REACT_APP_ENV === 'DEV' ? 'http://localhost:8888/' : 'https://shrimp-jam.com/',
      }}>
    <App />
    </Auth0Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
