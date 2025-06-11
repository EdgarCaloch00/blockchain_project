// src/components/EventForm.js
import React, { useContext, useEffect, useState } from 'react';
import '../styles/eventForm.css';
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
  }, [provider]);


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




  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventsContract) return;

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
    <form className="event-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="title">Título del Evento</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div className={`form-group ${highlightedField === 'date' ? 'highlight' : ''}`}>
        <label htmlFor="date">Fecha</label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={today}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="time">Hora</label>
        <input
          type="time"
          id="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />
      </div>
      <div className={`form-group ${highlightedField === 'totalSeats' ? 'highlight' : ''}`}>
        <label htmlFor="totalSeats">Capacidad de Asientos</label>
        <input
          type="number"
          id="totalSeats"
          value={totalSeats}
          onChange={handleNumberChange(setTotalSeats)}
          required
        />
      </div>
      <div className="form-group seat-group">
        <label>VIP</label>
        <div className="seat-inputs">
          <input
            type="number"
            id="prices.vip"
            name="vip"
            value={prices.vip}
            onChange={handlePriceChange}
            min="0"
            placeholder="Precio VIP"
            required
          />
          <input
            type="number"
            id="quantities.vip"
            name="vip"
            value={quantities.vip === 0 ? '' : quantities.vip}
            onChange={handleQuantityChange}
            min="0"
            placeholder="Cantidad VIP"
            required
          />
        </div>
      </div>
      <div className="form-group seat-group">
        <label>General A</label>
        <div className="seat-inputs">
          <input
            type="number"
            id="prices.generalA"
            name="generalA"
            value={prices.generalA}
            onChange={handlePriceChange}
            min="0"
            placeholder="Precio General A"
            required
          />
          <input
            type="number"
            id="quantities.generalA"
            name="generalA"
            value={quantities.generalA === 0 ? '' : quantities.generalA}
            onChange={handleQuantityChange}
            min="0"
            placeholder="Cantidad General A"
            required
          />
        </div>
      </div>
      <div className="form-group seat-group">
        <label>General B</label>
        <div className="seat-inputs">
          <input
            type="number"
            id="prices.generalB"
            name="generalB"
            value={prices.generalB}
            onChange={handlePriceChange}
            min="0"
            placeholder="Precio General B"
            required
          />
          <input
            type="number"
            id="quantities.generalB"
            name="generalB"
            value={quantities.generalB === 0 ? '' : quantities.generalB}
            onChange={handleQuantityChange}
            min="0"
            placeholder="Cantidad General B"
            required
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="category">Categoría</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">Seleccionar Categoría</option>
          <option value="music">Música</option>
          <option value="entertainment">Entretenimiento</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="image">Imagen del Evento</label>
        <input
          type="file"
          id="image"
          accept="image/*"
          onChange={handleImageChange}
          required
        />
        {imagePreview && (
          <img src={imagePreview} alt="Vista previa" className="image-preview" />
        )}
      </div>
      <div className="checkbox-group">
        <input
          type="checkbox"
          id="resellable"
          checked={resellable}
          onChange={(e) => setResellable(e.target.checked)}
        />
        <label htmlFor="resellable">Revendible</label>
      </div>
      <button type="submit" className="button">Registrar Evento</button>
    </form>
  );
}

export default EventForm;
