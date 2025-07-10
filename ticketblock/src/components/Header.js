import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/header.css';
import { FaBars, FaUser, FaSearch } from 'react-icons/fa';
import { Web3Context } from '../pages/web3';
const ethers = require("ethers");

function Header() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);
  const [connected, setConnection] = useState(false);
  const [Id, setId] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 900);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const logout = () => {
    setConnection(false);
    setId(null);
    setMenuOpen(false);
    window.location.reload(); // Or handle state cleanup without full reload
  };

  async function requestAccount() {
    if (window.ethereum && !isRequesting) {
      try {
        setIsRequesting(true);

        // Check if already connected
        const existingAccounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (existingAccounts.length > 0) {
          const address = existingAccounts[0];
          setConnection(true);
          setId(address);
          return;
        }

        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          const address = accounts[0];
          setConnection(true);
          setId(address);
        }

      } catch (error) {
        console.error("Connection error:", error);
        setConnection(false);
      } finally {
        setIsRequesting(false);
      }
    } else if (!window.ethereum) {
      console.error('Ethereum provider not found');
    }
  }

  // Check initial connection
  useEffect(() => {
    const checkAccounts = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setConnection(true);
            setId(accounts[0]);
          } else {
            setConnection(false);
          }
        } catch (error) {
          setConnection(false);
          console.error('Error checking accounts:', error);
        }
      }
    };

    checkAccounts();
  }, []);

  // 🔄 Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setId(accounts[0]);
          setConnection(true);
          console.log("MetaMask account changed to:", accounts[0]);
        } else {
          setId(null);
          setConnection(false);
          console.log("MetaMask disconnected.");
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <h1 className={`header-title ${isMobile ? 'mobile-title' : ''}`}>
            <Link to="/" className="header-link">{isMobile ? 'TB' : 'TicketBlock'}</Link>
          </h1>

          <div className="search-bar">
            {isMobile ? (
              <button type="button" className="search-icon"><FaSearch /></button>
            ) : (
              <>
                <input type="text" placeholder="Buscar eventos" />
                <button type="button" className="search-icon"><FaSearch /></button>
              </>
            )}
          </div>

          <nav className="nav">
            {!isMobile && (
              <div className="nav-links">
                <Link to="/events/music" className="nav-link">Música</Link>
                <Link to="/events/entertainment" className="nav-link">Entretenimiento</Link>
                <Link to="/myevents" className="nav-link">Mis eventos</Link>
                <Link to="/register-event" className="nav-link">Registrar</Link>
              </div>
            )}

            {isMobile ? (
              <>
                <Link to="/login" className="nav-icon"><FaUser /></Link>
                <button className="menu-icon" onClick={toggleMenu} style={{ marginLeft: '10px' }}><FaBars /></button>
              </>
            ) : (
              <button onClick={requestAccount}>
                {connected && Id ? `${Id.substring(0, 6)}...${Id.slice(-4)}` : "Conectarse"}
              </button>
            )}
          </nav>
        </div>
      </div>

      {menuOpen && (
        <div className="dropdown-menu" onMouseLeave={closeMenu}>
          <Link to="/myevents" className="dropdown-link" onClick={closeMenu}>Mis Eventos</Link>
          <button className="dropdown-link" onClick={logout}>Desconectarse</button>
        </div>
      )}
    </header>
  );
}

export default Header;
