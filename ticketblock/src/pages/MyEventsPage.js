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
  const [userAddress, setUserAddress] = useState(null);
  const provider = useContext(Web3Context);
  const navigate = useNavigate();

  // Setup contracts once
  useEffect(() => {
    const setupContracts = async () => {
      if (!provider || !window.ethereum) return;

      try {
        const networkId = 5777;

        const tfAddress = TicketFactoryABI.networks[networkId].address;
        const tfABI = TicketFactoryABI.abi;
        const tfContract = new ethers.Contract(tfAddress, tfABI, provider);
        setTicketFactoryContract(tfContract);

        const eventsAddress = EventsABI.networks[networkId].address;
        const eventsABI = EventsABI.abi;
        const eventsContract = new ethers.Contract(eventsAddress, eventsABI, provider);
        setEventsContract(eventsContract);
      } catch (err) {
        console.error('Contract setup error:', err);
      }
    };

    setupContracts();
  }, [provider]);

  // Detect current account + listen to account changes, recreating signer fresh each time
  useEffect(() => {
    const getCurrentAddress = async () => {
      if (window.ethereum && provider) {
        try {
          // Request accounts to prompt MetaMask connection if needed
          await window.ethereum.request({ method: 'eth_requestAccounts' });

          // Recreate signer fresh here — don't reuse any cached signer
          const freshSigner = new ethers.providers.Web3Provider(window.ethereum).getSigner();

          const address = await freshSigner.getAddress();
          console.log("Detected user address on reload (fresh signer):", address);
          setUserAddress(address);
        } catch (err) {
          console.error("Error getting current address:", err);
          setUserAddress(null);
        }
      }
    };

    getCurrentAddress();

    const handleAccountsChanged = (accounts) => {
      console.log('Accounts changed:', accounts);
      if (accounts.length > 0) {
        setUserAddress(accounts[0]);
      } else {
        setUserAddress(null);
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => window.location.reload());
      }
    };
  }, [provider]);

  // Reset events immediately on address change
  useEffect(() => {
    setMyEvents([]); // clear events when userAddress changes
  }, [userAddress]);

  // Fetch events for the current address
  useEffect(() => {
    const fetchUserEvents = async () => {
      if (!ticketFactoryContract || !eventsContract || !provider || !userAddress) return;

      try {
        const eventIds = await ticketFactoryContract.getOwnedEventIds(userAddress);
        const eventIdsReadable = eventIds.map(id => id.toNumber());

        console.log('Owned event IDs:', eventIdsReadable);

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
      } catch (err) {
        console.error('Failed to fetch user events:', err);
      }
    };

    fetchUserEvents();
  }, [ticketFactoryContract, eventsContract, provider, userAddress]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Tus Eventos Comprados</h1>

      {myEvents.length === 0 ? (
        <p>No has comprado boletos para ningún evento aún.</p>
      ) : (
        myEvents.map((event) => (
          <div key={event.eventId} className="border p-4 mb-4 rounded shadow">
            <h2 className="text-lg font-semibold">{event.title}</h2>
            <p>{event.description}</p>
            <p><strong>Fecha:</strong> {event.date}</p>
            <p><strong>Lugar:</strong> {event.place}</p>
            <p><strong>Categoría:</strong> {event.category}</p>
            <p><strong>Tickets vendidos:</strong> {event.ticketsSold}</p>
            <p><strong>Estado:</strong> {event.isActive ? 'Activo' : 'Inactivo'}</p>
            <button
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => navigate(`/ticket/${event.eventId}`)}
            >
              Ver boleto
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default MyEventsPage;
