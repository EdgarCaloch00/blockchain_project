// src/pages/RegisterEventPage.js
import React from 'react';
import EventForm from '../components/EventForm';
import '../styles/registerEventPage.css';

function RegisterEventPage() {
  const handleEventSubmit = (eventData) => {
    // Aquí puedes agregar la lógica para enviar los datos del evento a una API o manejarlos según tus necesidades.
    console.log('Datos del evento:', eventData);
  };

  return (
    <div className="register-event-page">
      <h1>Registrar Nuevo Evento</h1>
      <EventForm onSubmit={handleEventSubmit} />
    </div>
  );
}

export default RegisterEventPage;
