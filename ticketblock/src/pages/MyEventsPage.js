import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/myEventsPage.css';
import imagen1 from '../assets/images/evento1.jpeg';
import imagen2 from '../assets/images/evento2.jpeg';
import imagen3 from '../assets/images/evento3.jpeg';

// Datos de ejemplo para eventos comprados y creados
const purchasedEvents = [
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
];

function MyEventsPage() {
  return (
    <div className="my-events-page">
      <h1>Mis Eventos</h1>
      
      <section className="purchased-events">
        <h2>Eventos Comprados</h2>
        <ul className="events-list">
          {purchasedEvents.map(event => (
            <li key={event.id} className="event-item">
              <div className="event-info">
                <h2>{event.title}</h2>
                <p>Fecha: {event.date}</p>
                <p>Ubicación: {event.location}</p>
                <p>Asiento: {event.seat}</p>
                <Link to={`/ticket/${event.id}`} className="button">Ver Boleto</Link>
              </div>
              <img src={event.image} alt={event.title} className="event-thumbnail" />
            </li>
          ))}
        </ul>
      </section>

      <section className="created-events">
        <h2>Eventos Creados</h2>
        <ul className="events-list">
          {createdEvents.map(event => (
            <li key={event.id} className="event-item">
              <div className="event-info">
                <h2>{event.title}</h2>
                <p>Fecha: {event.date}</p>
                <p>Ubicación: {event.location}</p>
                <p>Boletos Disponibles: {event.ticketsAvailable}</p>
                <p>Categoría: {event.category}</p>
                <Link to={`/event/${event.id}`} className="button">Ver Detalles</Link>
              </div>
              <img src={event.image} alt={event.title} className="event-thumbnail" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default MyEventsPage;
