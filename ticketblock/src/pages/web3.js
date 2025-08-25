// web3.js
import React, { createContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      if (!window.ethereum) {
        alert("MetaMask not detected. Please install MetaMask.");
        return;
      }

      try {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await web3Provider.getNetwork();

        // Optional: Check chain ID
        if (network.chainId !== 1337) {
          alert("Please switch to the Ganache network in MetaMask (Chain ID 1337).");
          return;
        }

        // Request account access
        await web3Provider.send("eth_requestAccounts", []);

        const signer = web3Provider.getSigner();
        const address = await signer.getAddress();

        setProvider(web3Provider);
        setSigner(signer);
        setAccount(address);

        // Set up listeners
        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
      }
    };

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        const newProvider = new ethers.providers.Web3Provider(window.ethereum);
        const newSigner = newProvider.getSigner();
        const newAddress = await newSigner.getAddress();
        setProvider(newProvider);
        setSigner(newSigner);
        setAccount(newAddress);
        console.log("Switched to account:", newAddress);
      } else {
        setAccount(null);
        setSigner(null);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    initialize();

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  return (
    <Web3Context.Provider value={{ provider, signer, account }}>
      {children}
    </Web3Context.Provider>
  );
};
