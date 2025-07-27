import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Web3Context } from '../pages/web3';
const ethers = require("ethers");

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [dropdownBoletos, setDropdownBoletos] = useState(false);
  const [dropdownOrganizadores, setDropdownOrganizadores] = useState(false);
  const [connected, setConnection] = useState(false);
  const [Id, setId] = useState(null);
  const provider = useContext(Web3Context);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleAccountMenu = () => setAccountMenuOpen(!accountMenuOpen);
  const closeDropdowns = () => {
    setDropdownBoletos(false);
    setDropdownOrganizadores(false);
  };

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
            <div className="absolute right-0 mt-2 w-56 bg-black text-white rounded shadow-lg p-4 text-xs break-words z-50">
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
          <h1 className="text-2xl font-extrabold tracking-wide text-white">
            <Link to="/" className="hover:text-violet-400 transition" onClick={closeDropdowns}>TicketBlock</Link>
          </h1>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-white text-lg font-semibold hover:text-violet-400 transition" onClick={closeDropdowns}>Inicio</Link>

            {/* Dropdown: Boletos */}
            <div className="relative">
              <button
                onClick={() => {
                  setDropdownBoletos(!dropdownBoletos);
                  setDropdownOrganizadores(false);
                }}
                className="flex items-center gap-1 text-white text-lg font-semibold hover:text-violet-400 transition"
              >
                Entradas {dropdownBoletos ? <FiChevronUp /> : <FiChevronDown />}
              </button>
              <div
                className={`absolute bg-zinc-900 rounded shadow-md z-50 w-48 py-2 mt-2 transition-all duration-200 ${
                  dropdownBoletos ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible'
                }`}
              >
                <Link to="/events" className="block px-4 py-2 text-white hover:bg-violet-600" onClick={closeDropdowns}>Comprar boletos</Link>
                <Link to="/myevents" className="block px-4 py-2 text-white hover:bg-violet-600" onClick={closeDropdowns}>Mis entradas</Link>
              </div>
            </div>

            {/* Dropdown: Organizadores */}
            <div className="relative">
              <button
                onClick={() => {
                  setDropdownOrganizadores(!dropdownOrganizadores);
                  setDropdownBoletos(false);
                }}
                className="flex items-center gap-1 text-white text-lg font-semibold hover:text-violet-400 transition"
              >
                Backstage {dropdownOrganizadores ? <FiChevronUp /> : <FiChevronDown />}
              </button>
              <div
                className={`absolute bg-zinc-900 rounded shadow-md z-50 w-56 py-2 mt-2 transition-all duration-200 ${
                  dropdownOrganizadores ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible'
                }`}
              >
                <Link to="/register-event" className="block px-4 py-2 text-white hover:bg-violet-600" onClick={closeDropdowns}>Publicar evento</Link>
                <Link to="/myevents" className="block px-4 py-2 text-white hover:bg-violet-600" onClick={closeDropdowns}>Mis eventos</Link>
                <Link to="/scannerfront" className="block px-4 py-2 text-white hover:bg-violet-600" onClick={closeDropdowns}>Lector QR</Link>
              </div>
            </div>
            <Link to="/" className="text-white text-lg font-semibold hover:text-violet-400 transition" onClick={closeDropdowns}>Soporte</Link>

            {accountButton}
          </nav>

          {/* Mobile toggle */}
          <button onClick={toggleMenu} className="md:hidden text-white text-2xl">
            <FaBars />
          </button>
        </div>
      </div>

      {/* Mobile sidebar */}
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
          <Link to="/" className="text-white text-lg hover:text-violet-400" onClick={toggleMenu}>Inicio</Link>

          <p className="text-white font-semibold">Entradas</p>
          <Link to="/events" className="pl-4 text-white hover:text-violet-400" onClick={toggleMenu}>Comprar boletos</Link>
          <Link to="/mytickets" className="pl-4 text-white hover:text-violet-400" onClick={toggleMenu}>Mis entradas</Link>

          <p className="mt-4 text-white font-semibold">Backstage</p>
          <Link to="/register-event" className="pl-4 text-white hover:text-violet-400" onClick={toggleMenu}>Publicar evento </Link>
          <Link to="/myevents" className="pl-4 text-white hover:text-violet-400" onClick={toggleMenu}>Mis eventos</Link>
          <Link to="/scanner" className="pl-4 text-white hover:text-violet-400" onClick={toggleMenu}>Lector QR</Link>

          <div className="mt-6">{accountButton}</div>
        </nav>
      </div>
    </header>
  );
}
