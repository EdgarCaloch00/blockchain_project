// src/pages/EventDetailsPage.js
import { useParams } from 'react-router-dom';
import SeatingMap from '../components/SeatingMap';
import '../styles/eventDetail.css';
import TicketForm from '../components/TicketForm';
import imagen1 from '../assets/images/evento1.jpeg';
import { Web3Context } from './web3';
import React, { useContext, useEffect, useState } from 'react';
const EventsABI = require('../contractsABI/Events.json');
const TicketFactoryABI = require('../contractsABI/TicketFactory.json');
const ethers = require("ethers");

function EventDetailsPage() {
  const { id } = useParams();
  const { provider, signer } = useContext(Web3Context);
  const [eventDetail, setEventDetail] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [showSeatingMap, setShowSeatingMap] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!provider) return;

      const networkId = 1337; // Change as needed

      try {
        // Use signer if available, otherwise fallback to provider
        const eventsContractSignerOrProvider = signer || provider;

        // 1. Load Events contract connected to signer or provider
        const eventContractAddress = EventsABI.networks[networkId]?.address;
        if (!eventContractAddress) {
          throw new Error("Invalid Events contract address for network " + networkId);
        }
        const eventsContract = new ethers.Contract(eventContractAddress, EventsABI.abi, eventsContractSignerOrProvider);

        // 2. Fetch event detail
        const event = await eventsContract.getEvent(id);
        setEventDetail({
          eventId: event.eventId.toNumber(),
          title: event.title,
          description: event.description,
          category: event.category,
          place: event.place,
          date: new Date(event.date.toNumber() * 1000).toLocaleString(), // UNIX timestamp to string
          ticketsSold: event.ticketsSold.toNumber(),
          isActive: event.isActive,
          imageUrl: event.imageUrl,
        });

        // 3. Load TicketFactory contract connected to signer or provider
        const ticketFactoryContractAddress = TicketFactoryABI.networks[networkId]?.address;
        if (!ticketFactoryContractAddress) {
          throw new Error("Invalid TicketFactory contract address for network " + networkId);
        }
        const ticketFactoryContract = new ethers.Contract(ticketFactoryContractAddress, TicketFactoryABI.abi, eventsContractSignerOrProvider);

        // 4. Fetch tickets for the event
        const eventTickets = await ticketFactoryContract.getTicketsByEvent(id);
        console.log(eventTickets);
        const parsedTickets = eventTickets.map(ticket => ({
          eventId: ticket.eventId.toNumber(),
          ticketId: ticket.ticketId.toNumber(),
          price: ethers.utils.formatEther(ticket.price),
          ticketType: ticket.ticketType,
          owner: ticket.owner,
          resellable: ticket.resellable,
          sold: ticket.sold,
          scanned: ticket.scanned,
          row: ticket.row.toNumber(),
          column: ticket.column.toNumber()
        }));

        console.log("Raw ticketsByEvent from contract:", eventTickets);


        setTickets(parsedTickets);
      } catch (error) {
        console.error("Error fetching event detail or tickets:", error);
        setEventDetail({ error: "Evento no existe o error al cargar" });
      }
    };

    fetchData();
  }, [provider, signer, id]);

  if (!eventDetail) return <p>Cargando...</p>;
  if (eventDetail.error) return <p>{eventDetail.error}</p>;

  const isSoldOut = tickets.filter(t => !t.sold).length === 0;

  return (
    <div className="event-detail">
      <h1 className="event-title">{eventDetail.title}</h1>
      <img
        src={eventDetail.imageUrl || "https://via.placeholder.com/600x400?text=No+Image"}
        alt={eventDetail.title}
        className="event-image"
      />      
      <p className="event-description">{eventDetail.description}</p>
      <p className="event-date">Fecha: {eventDetail.date}</p>
      <p className="event-location">Ubicación: {eventDetail.place}</p>
      <p className="event-tickets-sold">Boletos vendidos: {eventDetail.ticketsSold}</p>
      <p className="event-status">Estado: {eventDetail.isActive ? "Activo" : "Inactivo"}</p>

      <h2>Boletos Disponibles</h2>
      <div className="ticket-types">
        {tickets.filter(t => !t.sold).map((ticket, index) => (
          <div key={index} className="tickets">
            <TicketForm
              eventDetail={eventDetail}
              ticket={ticket}
              onSubmit={(formData) => console.log("Formulario enviado:", formData)}
            />
          </div>
        ))}
      </div>

      <button
        className={`button ${isSoldOut ? 'disabled' : ''}`}
        onClick={() => !isSoldOut && setShowSeatingMap(true)}
        disabled={isSoldOut}
      >
        {isSoldOut ? 'Agotado' : 'Comprar Boletos'}
      </button>

      {showSeatingMap && (
        <SeatingMap
          availableSeats={tickets.filter(t => !t.sold)}
          totalSeats={tickets.length}
          onClose={() => setShowSeatingMap(false)}
        />
      )}
    </div>
  );
}

export default EventDetailsPage;
