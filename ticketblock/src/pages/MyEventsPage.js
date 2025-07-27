import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Web3Context } from '../pages/web3';
const TicketFactoryABI = require('../contractsABI/TicketFactory.json');
const EventsABI = require('../contractsABI/Events.json');
const ethers = require('ethers');

const MyEventsPage = () => {
  const [ticketFactoryContract, setTicketFactoryContract] = useState(null);
  const [eventsContract, setEventsContract] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [userAddress, setUserAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const provider = useContext(Web3Context);
  const navigate = useNavigate();

  useEffect(() => {
    const setupContracts = async () => {
      if (!provider || !window.ethereum) return;
      try {
        const networkId = 5777;
        const tfAddress = TicketFactoryABI.networks[networkId].address;
        const tfContract = new ethers.Contract(tfAddress, TicketFactoryABI.abi, provider);
        setTicketFactoryContract(tfContract);

        const eventsAddress = EventsABI.networks[networkId].address;
        const evContract = new ethers.Contract(eventsAddress, EventsABI.abi, provider);
        setEventsContract(evContract);
      } catch (err) {
        console.error('Contract setup error:', err);
      }
    };
    setupContracts();
  }, [provider]);

  useEffect(() => {
    const getCurrentAddress = async () => {
      if (window.ethereum && provider) {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const freshSigner = new ethers.providers.Web3Provider(window.ethereum).getSigner();
          const address = await freshSigner.getAddress();
          setUserAddress(address);
        } catch (err) {
          console.error("Error getting address:", err);
          setUserAddress(null);
        }
      }
    };
    getCurrentAddress();

    const handleAccountsChanged = (accounts) => {
      setUserAddress(accounts.length > 0 ? accounts[0] : null);
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => window.location.reload());
      }
    };
  }, [provider]);

  useEffect(() => {
    setMyEvents([]);
  }, [userAddress]);

  useEffect(() => {
    const fetchUserEvents = async () => {
      if (!ticketFactoryContract || !eventsContract || !provider || !userAddress) return;
      try {
        setLoading(true);
        const eventIds = await ticketFactoryContract.getOwnedEventIds(userAddress);
        const eventIdsReadable = eventIds.map(id => id.toNumber());

        const eventsData = await Promise.all(
          eventIdsReadable.map(async (id) => {
            const event = await eventsContract.getEvent(id);
            return {
              eventId: event.eventId.toString(),
              title: event.title,
              description: event.description,
              category: event.category,
              place: event.place,
              date: new Date(Number(event.date) * 1000).toLocaleString(),
              ticketsSold: event.ticketsSold.toString(),
              isActive: event.isActive
            };
          })
        );

        setMyEvents(eventsData);
        setFilteredEvents(eventsData);
      } catch (err) {
        console.error('Failed to fetch user events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserEvents();
  }, [ticketFactoryContract, eventsContract, provider, userAddress]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEvents(myEvents);
    } else {
      const lower = searchTerm.toLowerCase();
      const filtered = myEvents.filter(e =>
        e.title.toLowerCase().includes(lower) ||
        e.place.toLowerCase().includes(lower)
      );
      setFilteredEvents(filtered);
    }
  }, [searchTerm, myEvents]);

  return (
    <div className="pt-20 pb-6 px-6 mx-auto lg:px-16 text-white min-h-screen bg-neutral-950">
      <button
      onClick={() => window.history.back()}
      className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-black text-white hover:bg-zinc-950 transition z-50 shadow-md"
    >
      Regresar
    </button>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl py-3 font-semibold text-white">Boletos comprados</h1>
        <input
          type="text"
          placeholder="Buscar por nombre o lugar..."
          className="px-4 py-2 rounded-xl bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500 w-full sm:w-80"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center mt-20">
          <div className="animate-spin h-16 w-16 border-4 border-violet-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-400">Cargando tus boletos...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center mt-20 text-gray-400">
          <p className="text-lg mb-2">No se encontraron boletos.</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-700 transition rounded-xl text-white"
          >
            Volver al inicio
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {filteredEvents.map((event) => (
    <div
      key={event.eventId}
      className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl shadow-xl border border-zinc-700 hover:border-violet-500 transition overflow-hidden group"
    >
      {/* Imagen superior estilo Apple Music */}
      <div className="h-44 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1635070636690-d887c1a77e7b?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
      </div>

      {/* Contenido textual */}
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-white">{event.title}</h2>
        <p className="text-gray-400 mt-2 line-clamp-3">{event.description}</p>

        <div className="mt-4 space-y-1 text-sm text-gray-300">
          <p><span className="font-medium text-gray-400">Fecha:</span> {event.date}</p>
          <p><span className="font-medium text-gray-400">Lugar:</span> {event.place}</p>
          <p><span className="font-medium text-gray-400">Estado:</span> {event.isActive ? 'Activo' : 'Inactivo'}</p>
        </div>

        <button
          onClick={() => navigate(`/ticket/${event.eventId}`)}
          className="mt-5 px-4 py-2 bg-violet-600 hover:bg-violet-700 transition rounded-xl text-white w-full font-medium shadow-md"
        >
          Ver Boleto
        </button>
      </div>
    </div>
  ))}
</div>

      )}
    </div>
  );
};

export default MyEventsPage;
