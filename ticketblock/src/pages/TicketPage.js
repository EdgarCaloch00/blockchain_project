// src/pages/TicketPage.js
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/ticketPage.css';
import imagen1 from '../assets/images/evento1.jpeg';
import imagen2 from '../assets/images/evento2.jpeg';
import imagen3 from '../assets/images/evento3.jpeg';

const ticketData = {
  evento1: {
    title: "Concierto de Música",
    date: "20 de Mayo, 2024",
    time: "20:00",
    location: "Auditorio Nacional, Ciudad de México",
    seat: "Fila 1, Asiento 2",
    image: imagen1
  },
  evento2: {
    title: "Obra de Teatro",
    date: "25 de Mayo, 2024",
    time: "19:00",
    location: "Teatro Metropolitano, Ciudad de México",
    seat: "Fila 3, Asiento 5",
    image: imagen2
  },
  evento3: {
    title: "Festival de Comedia",
    date: "30 de Mayo, 2024",
    time: "18:00",
    location: "Foro Sol, Ciudad de México",
    seat: "Fila 2, Asiento 8",
    image: imagen3
  }
};

function TicketPage() {
  const { id } = useParams();
  const [showQR, setShowQR] = useState(false);
  const ticket = ticketData[id];

  if (!ticket) {
    return <p>Boleto no encontrado</p>;
  }

  return (
    <div className="ticket-page">
      <div className="background-blur" style={{ backgroundImage: `url(${ticket.image})` }}></div>
      <div className="ticket-content">
        <div className="ticket">
          <div className="ticket-details">
            <h1>{ticket.title}</h1>
            <p>Fecha: {ticket.date}</p>
            <p>Hora: {ticket.time}</p>
            <p>Ubicación: {ticket.location}</p>
            <p>Asiento: {ticket.seat}</p>
          </div>
          <div className="ticket-qr">
            {showQR ? (
              <p>Espacio para el código QR</p>
            ) : (
              <button className="button" onClick={() => setShowQR(true)}>Mostrar QR</button>
            )}
          </div>
        </div>
        <div className="ticket-actions">
          <button className="button" onClick={() => setShowQR(!showQR)}>
            {showQR ? 'Ocultar QR' : 'Mostrar QR'}
          </button>
          <button className="button">Transferir Boleto</button>
        </div>
      </div>
    </div>
  );
}

export default TicketPage;
