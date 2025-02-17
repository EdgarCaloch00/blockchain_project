import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/header.css';
import { FaBars, FaUser, FaSearch } from 'react-icons/fa'; // Importar los iconos
import { Web3Context } from '../pages/web3';
const ethers = require("ethers");


function Header() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);
  const [connected, setConnection] = useState(null); // State to store current account
  const [Id, setId] = useState(null); // State to store current account
  const provider = useContext(Web3Context);


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 900);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  async function requestAccount() {
    if (window.ethereum) {
      try {
        // Check if there are any connected accounts
        let accounts = await window.ethereum.request({ method: 'eth_accounts' });
  
        // If no accounts are connected, request account access
        if (accounts.length === 0) {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          
          setConnection(true);
          setId(address);
        }

      } catch (error) {
        setConnection(false);
      }
    } else {
      console.error('Ethereum provider not found');
    }
  }
  
  useEffect(() => {
    const checkAccounts = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });

          if (accounts.length > 0) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const address = await signer.getAddress();

            setConnection(true);
            setId(address);
          } else {
            setConnection(false);
          }
        } catch (error) {
          setConnection(false);
          console.error('Error:', error);
        }
      } else {
        console.error('Ethereum provider not found');
      }
    };

    checkAccounts();
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
              <button
                onClick={requestAccount}
              >{connected ? Id : "Conectarse"}</button>
            )}
          </nav>
        </div>
      </div>
      {menuOpen && (
        <div className="dropdown-menu" onMouseLeave={closeMenu}>
          <Link to="/myevents" className="dropdown-link" onClick={closeMenu}>Mis Eventos</Link>
          <Link to="/logout" className="dropdown-link" onClick={closeMenu}>Desconectarse</Link>
        </div>
      )}
    </header>
  );
}

export default Header;
