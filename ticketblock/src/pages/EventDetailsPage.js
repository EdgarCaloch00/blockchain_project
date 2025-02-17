// src/pages/EventDetailsPage.js
import { useParams } from 'react-router-dom';
import SeatingMap from '../components/SeatingMap';
import '../styles/eventDetail.css';
import imagen1 from '../assets/images/evento1.jpeg';
import { Web3Context } from './web3';
import React, {useContext, useEffect, useState } from 'react';
const EventsABI = require('../contractsABI/Events.json');
const ethers = require("ethers");


function EventDetailsPage() {
  const [eventDetail, setEventDetail] = useState([]);
  const provider = useContext(Web3Context);

  useEffect(() => {
    const fetchData = async () => {
      if (!provider) return;
      const networkId = 5777; // Change this if your network ID is different
      const contractAddress = EventsABI.networks[networkId].address;
      const contractABI = EventsABI.abi;

      const eventsContract = new ethers.Contract(contractAddress, contractABI, provider);

      try {
        const eventDetail = await eventsContract.getEvent(id);

        setEventDetail({
          eventId: eventDetail.eventId.toNumber(),
          title: eventDetail.title,
          description: eventDetail.description,
          location: eventDetail.place,
        });

      } catch (error) {
        setEventDetail({ error: "Evento no existe" });

      }
    };

    fetchData();
  }, [provider]);
  
  const { id } = useParams();
  const [showSeatingMap, setShowSeatingMap] = useState(false);

  // Datos de ejemplo. En una aplicación real, estos datos vendrían de una API o estado global.
  const eventData = {
    evento3: {
      title: "Festival de Comedia",
      description: "Un festival de comedia con los mejores comediantes.",
      date: "30 de Mayo, 2024",
      time: "18:00",
      location: "Foro Sol, Ciudad de México",
      ticketsAvailable: true,
      resellable: true,
      image: "/path/to/evento3.jpg",
      ticketTypes: [
        { type: "VIP", section: "Zona B", price: "MXN 900" },
        { type: "General A", section: "Zona A", price: "MXN 450" },
        { type: "General B", section: "Zona A", price: "MXN 300" }
      ],
      availableSeats: ["3-1", "3-2", "3-3", "4-1", "4-2", "4-3"],
      totalSeats: 120
    }
  };

  const event = eventData[id];

  if (eventDetail.error) {
    return <p>{eventDetail.error}</p>;
  }

  
  return(
  <div>
    <p>Event ID: {eventDetail.eventId}</p>
    <p>Title: {eventDetail.title}</p>
    <p>Description: {eventDetail.description}</p>
  </div>
  );

  const isSoldOut = event.availableSeats.length === 0;

  /*
  return (
    <div className="event-detail">
      <h1 className="event-title">{event.title}</h1>
      <img src={event.image} alt={event.title} className="event-image" />
      <p className="event-description">{event.description}</p>
      <p className="event-date">Fecha: {event.date}</p>
      <p className="event-time">Hora: {event.time}</p>
      <p className="event-location">Ubicación: {event.location}</p>
      <p className="event-tickets">
        Boletos disponibles: {event.ticketsAvailable ? "Sí" : "No"}
      </p>
      <p className="event-resellable">
        Revendible: {event.resellable ? "Sí" : "No"}
      </p>
      <h2>Tipos de boletos disponibles</h2>
      <div className="ticket-types">
        {event.ticketTypes.map((ticket, index) => (
          <div key={index} className="ticket-type">
            <h3>{ticket.type}</h3>
            <p>Sección: {ticket.section}</p>
            <p>Precio: {ticket.price}</p>
          </div>
        ))}
      </div>
      <button 
        className={`button ${isSoldOut ? 'disabled' : ''}`} 
        onClick={() => !isSoldOut && setShowSeatingMap(true)}
        disabled={isSoldOut}
      >
        {isSoldOut ? 'No disponible' : 'Comprar Boletos'}
      </button>
      {showSeatingMap && (
        <SeatingMap
          availableSeats={event.availableSeats}
          totalSeats={event.totalSeats}
          onClose={() => setShowSeatingMap(false)}
        />
      )}
    </div>
  );*/
}

export default EventDetailsPage;
