import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { Web3Provider } from './pages/web3'; // Import Web3Provider from the src folder
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Web3Provider>
      <App />
    </Web3Provider>

);

reportWebVitals();
