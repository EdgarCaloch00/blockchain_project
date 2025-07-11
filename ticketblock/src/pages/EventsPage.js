// src/pages/EventsPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/eventsPage.css'; // Asegúrate de crear este archivo de estilos

const events = [
  {
    id: 'evento1',
    title: 'Concierto de Música',
    date: '20 de Mayo, 2024',
    time: '20:00',
    location: 'Auditorio Nacional',
    ticketTypes: [
      { type: 'VIP', price: 1000 },
      { type: 'General A', price: 500 },
      { type: 'General B', price: 300 }
    ],
    availableSeats: 5 // Ejemplo de asientos disponibles
  },
  {
    id: 'evento2',
    title: 'Obra de Teatro',
    date: '25 de Mayo, 2024',
    time: '19:00',
    location: 'Teatro Metropolitano',
    ticketTypes: [
      { type: 'VIP', price: 700 },
      { type: 'General A', price: 350 },
      { type: 'General B', price: 200 }
    ],
    availableSeats: 0 // Ejemplo de asientos disponibles
  },
  {
    id: 'evento3',
    title: 'Festival de Comedia',
    date: '30 de Mayo, 2024',
    time: '18:00',
    location: 'Foro Sol',
    ticketTypes: [
      { type: 'VIP', price: 900 },
      { type: 'General A', price: 450 },
      { type: 'General B', price: 300 }
    ],
    availableSeats: 20 // Ejemplo de asientos disponibles
  }
];

const EventsPage = () => {
  return (
    <div className="events-page">
      <h1>Eventos Disponibles</h1>
      <ul className="events-list">
        {events.map((event) => {
          // Encuentra el precio más bajo entre los tipos de boletos
          const lowestPrice = Math.min(...event.ticketTypes.map(ticket => ticket.price));
          // Define el mensaje de disponibilidad
          let availabilityMessage = '';
          if (event.availableSeats === 0) {
            availabilityMessage = 'Agotado';
          } else if (event.availableSeats <= 10) {
            availabilityMessage = 'Últimos boletos';
          } else {
            availabilityMessage = `Boletos disponibles desde: MXN ${lowestPrice}`;
          }

          return (
            <li key={event.id} className="event-item">
              <h2>{event.title}</h2>
              <p>{event.date} a las {event.time}</p>
              <p>{event.location}</p>
              <p>{availabilityMessage}</p>
              <Link 
                to={`/event/${event.id}`} 
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
