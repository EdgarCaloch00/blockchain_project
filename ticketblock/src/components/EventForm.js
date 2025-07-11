// src/components/EventForm.js
import React, { useContext, useEffect, useState } from 'react';
import { Web3Context } from '../pages/web3';
const ethers = require("ethers");
const EventsABI = require('../contractsABI/Events.json');
const TicketFactoryABI = require('../contractsABI/TicketFactory.json');

function EventForm({ onSubmit }) {
  const [eventsContract, setEventsContract] = useState(null);
  const [connectedContract, setConnectedContract] = useState(null);
  const [ticketFactoryContract, setTicketFactoryContract] = useState(null);

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

        // TicketFactory contract setup
        const ticketFactoryContractAddress = TicketFactoryABI.networks[networkId].address;
        const ticketFactoryContractABI = TicketFactoryABI.abi;
        const ticketFactoryContract = new ethers.Contract(ticketFactoryContractAddress, ticketFactoryContractABI, provider);

        // Signer for write access
        const signer = await provider.getSigner();

        const connectedEventsContract = eventsContract.connect(signer);
        const connectedTicketFactoryContract = ticketFactoryContract.connect(signer);

        // Save connected contracts in state
        setConnectedContract(connectedEventsContract);
        setEventsContract(eventsContract);
        setTicketFactoryContract(connectedTicketFactoryContract);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);


  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [resellable, setResellable] = useState(false);
  const [totalSeats, setTotalSeats] = useState('');

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prices, setPrices] = useState({
    vip: '',
    generalA: '',
    generalB: ''
  });
  const [quantities, setQuantities] = useState({
    vip: 0,
    generalA: 0,
    generalB: 0
  });
  const [category, setCategory] = useState('');
  const [highlightedField, setHighlightedField] = useState('');
  const [today, setToday] = useState('');

  useEffect(() => {
    const currentDate = new Date().toISOString().split('T')[0];
    setToday(currentDate);
  }, []);




 const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!eventsContract || isSubmitting) return;

  setIsSubmitting(true);

    const currentDate = new Date();
    const eventDate = new Date(date);
    const totalTickets = parseInt(quantities.vip, 10) + parseInt(quantities.generalA, 10) + parseInt(quantities.generalB, 10);

    if (eventDate < currentDate.setHours(0, 0, 0, 0)) {
      alert('La fecha del evento no puede ser en el pasado.');
      setHighlightedField('date');
      return;
    }

    if (totalTickets > totalSeats) {
      alert('La suma de boletos no puede ser mayor que la capacidad de asientos del recinto.');
      setHighlightedField('totalSeats');
      return;
    }

    try {
      await connectedContract.createEvent(
        title,
        description,
        category,
        "location",
        Math.floor(eventDate.getTime() / 1000)
      );


      alert("¡Evento creado con éxito!");
      setHighlightedField("");

      const totalEvents = await eventsContract.getEventsCount();
      const newEventId = totalEvents.toNumber() - 1; // eventId of the newly created event

      // Call generateTicketsForEvent on TicketFactory contract
      await ticketFactoryContract.generateEventTickets(
        newEventId,
        parseInt(quantities.generalA, 10),  // type A quantity
        parseInt(prices.generalA, 10),      // type A price
        parseInt(quantities.generalB, 10),  // type B quantity
        parseInt(prices.generalB, 10),      // type B price
        parseInt(quantities.vip, 10),       // VIP quantity
        parseInt(prices.vip, 10),           // VIP price
        true                               // resellable, change as needed
      );

      window.location.reload(); // Reloads the current page


    } catch (error) {
      console.error('Error adding event:', error);
    }
  };


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setPrices({
      ...prices,
      [name]: value >= 0 ? value : 0
    });
  };

  const handleQuantityChange = (e) => {
    const { name, value } = e.target;
    const totalTickets = quantities.vip + quantities.generalA + quantities.generalB - quantities[name] + (value === '' ? 0 : +value); // Use +value to coerce to a number

    if (totalTickets > totalSeats) {
      alert('La suma de boletos no puede ser mayor que la capacidad de asientos del recinto.');
      setHighlightedField(name);
      return;
    }

    setQuantities({
      ...quantities,
      [name]: value === '' ? 0 : Math.max(0, +value) // Ensure the value is non-negative, default to 0 if empty
    });

    setHighlightedField('');
  };

  const handleNumberChange = (setter) => (e) => {
    const value = e.target.value;
    setter(value === '' ? '' : Math.max(0, parseInt(value, 10)));
    setHighlightedField('');
  };






    return (
  <div className="py-16 px-4 flex justify-center items-start" style={{
    backgroundImage: `url('https://images.unsplash.com/photo-1635614017406-7c192d832072?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
  }}>
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-3xl bg-black/70 backdrop-blur-lg rounded-2xl shadow-lg p-8 space-y-8"
    >
      {/* Hero Text */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-white mb-2">Crear Nuevo Evento</h2>
        <p className="text-gray-400 max-w-xl mx-auto">
          Completa la información para que tu evento destaque y tus asistentes tengan la mejor experiencia.
        </p>
      </div>

      {/* Título */}
      <div>
        <label htmlFor="title" className="block text-lg font-medium text-gray-300 mb-2">
          Título del Evento
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Ej. Concierto de Verano"
          className="w-full px-4 py-3 rounded-2xl bg-black text-white border border-neutral-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="description" className="block text-lg font-medium text-gray-300 mb-2">
          Descripción
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
          placeholder="Describe la experiencia, line up, o detalles importantes..."
          className="w-full px-4 py-3 rounded-2xl bg-black text-white border border-neutral-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
      </div>

      {/* Fecha */}
      <div>
        <label htmlFor="date" className="block text-lg font-medium text-gray-300 mb-2">
          Fecha del Evento
        </label>
        <input
          type="date"
          id="date"
          value={date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
          required
          className={`w-full px-4 py-3 rounded-2xl bg-black text-white border ${
            highlightedField === 'date' ? 'border-red-500' : 'border-neutral-800'
          } focus:outline-none focus:ring-2 focus:ring-gray-500`}
        />
      </div>

      {/* Hora */}
      <div>
        <label htmlFor="time" className="block text-lg font-medium text-gray-300 mb-2">
          Hora de Inicio
        </label>
        <input
          type="time"
          id="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-2xl bg-black text-white border border-neutral-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
      </div>

      {/* Capacidad */}
      <div>
        <label htmlFor="totalSeats" className="block text-lg font-medium text-gray-300 mb-2">
          Capacidad Total de Asientos
        </label>
        <input
          type="number"
          id="totalSeats"
          value={totalSeats}
          onChange={handleNumberChange(setTotalSeats)}
          required
          placeholder="Ej. 500"
          className={`w-full px-4 py-3 rounded-2xl bg-black text-white border ${
            highlightedField === 'totalSeats' ? 'border-red-500' : 'border-neutral-700'
          } focus:outline-none focus:ring-2 focus:ring-gray-500`}
        />
      </div>

      {/* Boletos */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-white">Configuración de Boletos</h3>

        {/* VIP */}
        <div>
          <label className="block text-lg font-semibold text-gray-300 mb-2">VIP</label>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                name="vip"
                value={prices.vip}
                onChange={handlePriceChange}
                placeholder="Precio VIP"
                min="0"
                required
                className="w-full pl-8 pr-4 py-3 rounded-2xl bg-black text-white border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <input
              type="number"
              name="vip"
              value={quantities.vip === 0 ? '' : quantities.vip}
              onChange={handleQuantityChange}
              placeholder="Cantidad VIP"
              min="0"
              required
              className="flex-1 px-4 py-3 rounded-2xl bg-black text-white border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
        </div>

        {/* General A */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-1">General A</label>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                name="generalA"
                value={prices.generalA}
                onChange={handlePriceChange}
                placeholder="Precio General A"
                min="0"
                required
                className="w-full pl-8 pr-4 py-3 rounded-2xl bg-black text-white border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <input
              type="number"
              name="generalA"
              value={quantities.generalA === 0 ? '' : quantities.generalA}
              onChange={handleQuantityChange}
              placeholder="Cantidad General A"
              min="0"
              required
              className="flex-1 px-4 py-3 rounded-2xl bg-black text-white border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
        </div>

        {/* General B */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-1">General B</label>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                name="generalB"
                value={prices.generalB}
                onChange={handlePriceChange}
                placeholder="Precio General B"
                min="0"
                required
                className="w-full pl-8 pr-4 py-3 rounded-2xl bg-black text-white border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <input
              type="number"
              name="generalB"
              value={quantities.generalB === 0 ? '' : quantities.generalB}
              onChange={handleQuantityChange}
              placeholder="Cantidad General B"
              min="0"
              required
              className="flex-1 px-4 py-3 rounded-2xl bg-black text-white border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Categoría */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
          Categoría del Evento
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-2xl bg-black text-white border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <option value="">Seleccionar</option>
          <option value="music">Música</option>
          <option value="entertainment">Entretenimiento</option>
        </select>
      </div>

      {/* Imagen */}
      <div>
        <label htmlFor="image" className="block text-lg font-medium text-gray-300 mb-1">
          Imagen del Evento
        </label>
        <input
          type="file"
          id="image"
          accept="image/*"
          onChange={handleImageChange}
          required
          className="w-full text-gray-300"
        />
        {imagePreview && (
          <img src={imagePreview} alt="Vista previa" className="mt-4 rounded-lg w-full h-auto object-cover" />
        )}
      </div>

      {/* Checkbox */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="resellable"
          checked={resellable}
          onChange={(e) => setResellable(e.target.checked)}
          className="h-5 w-5 text-gray-500"
        />
        <label htmlFor="resellable" className="text-sm text-gray-300">
          Permitir reventa de boletos
        </label>
      </div>

      {/* Botón */}
      <button
        type="submit"
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-lg transition duration-300"
      >
        Registrar Evento
      </button>
    </form>
  </div>
);

}

export default EventForm;
