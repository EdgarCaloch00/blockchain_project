// web3.js
import React, { createContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    const rpcUrl = 'http://localhost:7545'; // Replace with your Ganache RPC URL
    const rpcProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    //const rpcProvider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(rpcProvider);

    return () => {
      if (provider) {
        provider.removeAllListeners();
      }
    };
  }, []); 

  return (
    <Web3Context.Provider value={provider}>
      {children}
    </Web3Context.Provider>
  );
};