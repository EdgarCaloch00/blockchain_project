import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import { Web3Context } from '../pages/web3';
const ethers = require("ethers");

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [connected, setConnection] = useState(false);
  const [Id, setId] = useState(null);
  const provider = useContext(Web3Context);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleAccountMenu = () => setAccountMenuOpen(!accountMenuOpen);

  async function requestAccount() {
    if (window.ethereum) {
      try {
        let accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length === 0) {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        }
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = web3Provider.getSigner();
        const address = await signer.getAddress();
        setConnection(true);
        setId(address);
      } catch (error) {
        setConnection(false);
        console.error(error);
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
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = web3Provider.getSigner();
            const address = await signer.getAddress();
            setConnection(true);
            setId(address);
          } else {
            setConnection(false);
          }
        } catch (error) {
          setConnection(false);
          console.error(error);
        }
      } else {
        console.error('Ethereum provider not found');
      }
    };
    checkAccounts();
  }, []);

  const navLinks = (
    <>
      <Link to="/" onClick={menuOpen ? toggleMenu : undefined} className="block text-lg text-white hover:text-violet-400 transition font-semibold">Inicio</Link>
      <Link to="/myevents" onClick={menuOpen ? toggleMenu : undefined} className="block text-lg text-white hover:text-violet-400 transition font-semibold">Mis Compras</Link>
      <Link to="/register-event" onClick={menuOpen ? toggleMenu : undefined} className="block text-lg text-white hover:text-violet-400 transition font-semibold">Crear Evento</Link>
        <Link to="/events/music" onClick={menuOpen ? toggleMenu : undefined} className="block text-lg text-white hover:text-violet-400 transition font-semibold">Mis Eventos</Link>
    </>
  );

  const accountButton = (
    <div className="relative">
      {connected ? (
        <>
          <button
            onClick={toggleAccountMenu}
            className="px-4 py-1 bg-violet-600 text-white rounded-full hover:bg-violet-700 transition"
          >
            Mi Cuenta
          </button>
          {accountMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-black text-white rounded shadow-lg p-4 text-xs break-words">
              <p>{Id}</p>
              <button
                onClick={() => {
                  setConnection(false);
                  setId(null);
                  setAccountMenuOpen(false);
                }}
                className="mt-2 w-full px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Desconectarse
              </button>
            </div>
          )}
        </>
      ) : (
        <button
          onClick={requestAccount}
          className="px-4 py-1 bg-violet-500 text-black rounded-full hover:bg-violet-400 transition"
        >
          Conectarse
        </button>
      )}
    </div>
  );

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <h1 className="text-2xl font-extrabold tracking-wide text-white">
            <Link to="/" className="hover:text-violet-400 transition">TicketBlock</Link>
          </h1>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks}
            {accountButton}
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-white text-2xl"
          >
            <FaBars />
          </button>
        </div>
      </div>

      {/* Menú lateral móvil */}
      <div
        className={`fixed top-0 right-0 h-full w-2/3 bg-black transform ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        } transition-transform duration-300 ease-in-out z-50`}
      >
        <div className="flex justify-between items-center p-4 border-b border-violet-500">
          <h2 className="text-xl text-white">Menú</h2>
          <button onClick={toggleMenu} className="text-white text-2xl">
            <FaTimes />
          </button>
        </div>

        <nav className="flex flex-col p-6 space-y-4">
          {navLinks}
          <div className="mt-4">{accountButton}</div>
        </nav>
      </div>
    </header>
  );
}
