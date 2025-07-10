// src/pages/EventsPage.js
import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import '../styles/eventsPage.css';
import { Web3Context } from './web3';
const ethers = require('ethers');
const EventsABI = require('../contractsABI/Events.json');
const TicketFactoryABI = require('../contractsABI/TicketFactory.json');

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const provider = useContext(Web3Context);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!provider) return;

      try {
        const networkId = 5777;
        const eventContractAddress = EventsABI.networks[networkId]?.address;
        const ticketFactoryAddress = TicketFactoryABI.networks[networkId]?.address;

        if (!eventContractAddress || !ticketFactoryAddress) {
          console.error('Missing contract address');
          return;
        }

        const eventsContract = new ethers.Contract(eventContractAddress, EventsABI.abi, provider);
        const ticketFactoryContract = new ethers.Contract(ticketFactoryAddress, TicketFactoryABI.abi, provider);

        const rawEvents = await eventsContract.displayEvents();

        const upcoming = rawEvents.filter(event => new Date(event.date * 1000) >= new Date());

        const parsed = await Promise.all(upcoming.map(async (event) => {
          const eventId = event.eventId.toNumber();
          const availableSeats = Number(event.availableSeats);

          // Fetch available tickets for the event
          const tickets = await ticketFactoryContract.getTicketsByEvent(eventId);
          const unsold = tickets.filter(ticket => !ticket.sold);
          const prices = unsold.map(ticket => parseFloat(ethers.utils.formatEther(ticket.price)));

          const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;

          return {
            eventId,
            title: event.title,
            location: event.place,
            date: new Date(event.date * 1000).toLocaleDateString(),
            time: new Date(event.date * 1000).toLocaleTimeString(),
            availableSeats,
            lowestPrice
          };
        }));

        setEvents(parsed);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
    };

    fetchEvents();
  }, [provider]);

  return (
    <div className="events-page">
      <h1>Eventos Disponibles</h1>
      <ul className="events-list">
        {events.map((event) => {
          let availabilityMessage = '';
          if (event.availableSeats === 0) {
            availabilityMessage = 'Agotado';
          } else if (event.availableSeats <= 10) {
            availabilityMessage = 'Últimos boletos';
          } else if (event.lowestPrice !== null) {
            availabilityMessage = `Boletos disponibles desde: ${event.lowestPrice} ETH`;
          } else {
            availabilityMessage = 'Boletos disponibles';
          }

          return (
            <li key={event.eventId} className="event-item">
              <h2>{event.title}</h2>
              <p>{event.date} a las {event.time}</p>
              <p>{event.location}</p>
              <p>{availabilityMessage}</p>
              <Link
                to={`/event/${event.eventId}`}
                className={`button ${event.availableSeats === 0 ? 'disabled' : ''}`}
                tabIndex={event.availableSeats === 0 ? '-1' : '0'}
                aria-disabled={event.availableSeats === 0 ? 'true' : 'false'}
                onClick={(e) => event.availableSeats === 0 && e.preventDefault()}
              >
                {event.availableSeats === 0 ? 'No disponible' : 'Ver Detalles'}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default EventsPage;
