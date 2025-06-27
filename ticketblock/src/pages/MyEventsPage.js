import React, { useContext, useEffect, useState } from 'react';
//import { Link } from 'react-router-dom';
import '../styles/myEventsPage.css';
import { Web3Context } from '../pages/web3';
import imagen1 from '../assets/images/evento1.jpeg';
import imagen2 from '../assets/images/evento2.jpeg';
import imagen3 from '../assets/images/evento3.jpeg';
const EventsABI = require('../contractsABI/Events.json');
const ethers = require("ethers");

// Datos de ejemplo para eventos comprados y creados
/*const purchasedEvents = [
  {
    id: 'evento1',
    title: 'Concierto de Música',
    date: '20 de Mayo, 2024',
    location: 'Auditorio Nacional, Ciudad de México',
    seat: 'Fila 1, Asiento 2',
    image: imagen1
  },
  {
    id: 'evento2',
    title: 'Obra de Teatro',
    date: '25 de Mayo, 2024',
    location: 'Teatro Metropolitano, Ciudad de México',
    seat: 'Fila 3, Asiento 5',
    image: imagen2
  }
];

const createdEvents = [
  {
    id: 'evento3',
    title: 'Festival de Comedia',
    date: '30 de Mayo, 2024',
    location: 'Foro Sol, Ciudad de México',
    image: imagen3,
    ticketsAvailable: 20,
    category: 'entertainment'
  },
  {
    id: 'evento4',
    title: 'Show de Magia',
    date: '15 de Junio, 2024',
    location: 'Teatro Insurgentes, Ciudad de México',
    image: imagen3,
    ticketsAvailable: 50,
    category: 'entertainment'
  }
];*/

const MyEventsPage = () => {
  const [eventsContract, setEventsContract] = useState(null);

  const provider = useContext(Web3Context);

  useEffect(() => {
    const fetchData = async () => {
      if (!provider) return;

      if (!window.ethereum) {
        console.error('MetaMask is not installed');
        return;
      }

      try {
        const networkId = 5777; // Change if different

        // Events contract setup
        const eventContractAddress = EventsABI.networks[networkId].address;
        const eventsContractABI = EventsABI.abi;
        const eventsContract = new ethers.Contract(eventContractAddress, eventsContractABI, provider);

        // Signer for write access
        setEventsContract(eventsContract);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [provider]);

  // Call getMyEvents from contract
  useEffect(() => {
    const fetchEvents = async () => {
      if (!eventsContract) return;

      try {
        const myEvents = await eventsContract.getMyEvents();
        console.log('Events you have tickets for:', myEvents);
      } catch (err) {
        console.error('Failed to fetch events', err);
      }
    };

    fetchEvents();
  }, [eventsContract]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">Your Purchased Events</h1>
      <p>Check the console for output.</p>
    </div>
  );
};

export default MyEventsPage;
