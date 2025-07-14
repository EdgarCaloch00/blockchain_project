import React, { useContext, useEffect, useState } from 'react';
import { Web3Context } from '../pages/web3';
const ethers = require("ethers");
const EventsABI = require('../contractsABI/Events.json');
const TicketFactoryABI = require('../contractsABI/TicketFactory.json');

const LOCATIONS = [
  {
    name: "Estadio GNP",
    totalSeats: 40,
    quantities: { vip: 10, generalA: 20, generalB: 10 }
  },
  {
    name: "Arena CDMX",
    totalSeats: 20,
    quantities: { vip: 5, generalA: 8, generalB: 7 }
  },
  {
    name: "Foro Sol",
    totalSeats: 50,
    quantities: { vip: 10, generalA: 20, generalB: 20 }
  }
];

function EventForm() {
  const [eventsContract, setEventsContract] = useState(null);
  const [connectedContract, setConnectedContract] = useState(null);
  const [ticketFactoryContract, setTicketFactoryContract] = useState(null);

  const provider = useContext(Web3Context);

  useEffect(() => {
    const fetchData = async () => {
      if (!provider || !window.ethereum) return;

      try {
        const networkId = 5777;

        const eventContractAddress = EventsABI.networks[networkId].address;
        const eventsContractABI = EventsABI.abi;
        const eventsContract = new ethers.Contract(eventContractAddress, eventsContractABI, provider);

        const ticketFactoryContractAddress = TicketFactoryABI.networks[networkId].address;
        const ticketFactoryContractABI = TicketFactoryABI.abi;
        const ticketFactoryContract = new ethers.Contract(ticketFactoryContractAddress, ticketFactoryContractABI, provider);

        const signer = await provider.getSigner();
        const connectedEventsContract = eventsContract.connect(signer);
        const connectedTicketFactoryContract = ticketFactoryContract.connect(signer);

        setConnectedContract(connectedEventsContract);
        setEventsContract(eventsContract);
        setTicketFactoryContract(connectedTicketFactoryContract);

      } catch (error) {
        console.error('Error fetching contracts:', error);
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
  const [prices, setPrices] = useState({ vip: '', generalA: '', generalB: '' });
  const [quantities, setQuantities] = useState({ vip: 0, generalA: 0, generalB: 0 });
  const [category, setCategory] = useState('');
  const [highlightedField, setHighlightedField] = useState('');
  const [today, setToday] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [seatMap, setSeatMap] = useState([]);

  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0]);
  }, []);

  const generateSeatMap = (total, seatQuantities) => {
  const columnsCount = 10;
  const rowsCount = Math.ceil(total / columnsCount);
  const rows = Array.from({ length: rowsCount }, (_, i) => String.fromCharCode(65 + i));
  const seats = [];
  let seatCounter = 0;

  rows.forEach((row) => {
    for (let col = 1; col <= columnsCount; col++) {
      seatCounter++;
      if (seatCounter <= total) {
        let zone = "";
        if (seatCounter <= seatQuantities.vip) {
          zone = "VIP";
        } else if (seatCounter <= seatQuantities.vip + seatQuantities.generalA) {
          zone = "General A";
        } else {
          zone = "General B";
        }
        seats.push({
          row,
          column: col,
          selected: true, // Solo informativo
          zone
        });
      }
    }
  });

  return seats;
};


  const handleLocationChange = (e) => {
  const selectedName = e.target.value;
  setLocation(selectedName);
  const found = LOCATIONS.find(loc => loc.name === selectedName);
  if (found) {
    setTotalSeats(found.totalSeats);
    setQuantities(found.quantities);
    setSeatMap(generateSeatMap(found.totalSeats, found.quantities));
  } else {
    setTotalSeats('');
    setQuantities({ vip: 0, generalA: 0, generalB: 0 });
    setSeatMap([]);
  }
};


  const toggleSeat = (row, column) => {
    setSeatMap(prev =>
      prev.map(seat =>
        seat.row === row && seat.column === column
          ? { ...seat, selected: !seat.selected }
          : seat
      )
    );
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setPrices({
      ...prices,
      [name]: value >= 0 ? value : 0
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleNumberChange = (setter) => (e) => {
    const value = e.target.value;
    setter(value === '' ? '' : Math.max(0, parseInt(value, 10)));
    setHighlightedField('');
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!eventsContract || isSubmitting) return;

  setIsSubmitting(true);

  const currentDate = new Date();
  const eventDate = new Date(date);
  const totalTickets = quantities.vip + quantities.generalA + quantities.generalB;

  if (eventDate < currentDate.setHours(0, 0, 0, 0)) {
    alert('La fecha del evento no puede ser en el pasado.');
    setHighlightedField('date');
    setIsSubmitting(false);
    return;
  }

  if (totalTickets > totalSeats) {
    alert('La suma de boletos no puede ser mayor que la capacidad de asientos del recinto.');
    setHighlightedField('totalSeats');
    setIsSubmitting(false);
    return;
  }

  try {
    await connectedContract.createEvent(
      title,
      description,
      category,
      location,
      Math.floor(eventDate.getTime() / 1000)
    );

    alert("¡Evento creado con éxito!");

    const totalEvents = await eventsContract.getEventsCount();
    const newEventId = totalEvents.toNumber() - 1;

    await ticketFactoryContract.generateEventTickets(
  newEventId,
  quantities.generalA,
  parseInt(prices.generalA, 10),
  quantities.generalB,
  parseInt(prices.generalB, 10),
  quantities.vip,
  parseInt(prices.vip, 10),
  resellable
);


    // Ya no necesitas seatMap aquí porque las cantidades vienen directo

    window.location.reload();

  } catch (error) {
    console.error('Error adding event:', error);
    setIsSubmitting(false);
  }
};


  function SeatGrid({ seats }) {
  const columnsCount = 10;
  const rows = Array.from(new Set(seats.map(s => s.row))).sort();

  return (
    <div className="space-y-4 text-white">
      {["VIP", "General A", "General B"].map(zone => {
        const zoneSeats = seats.filter(s => s.zone === zone);
        if (zoneSeats.length === 0) return null;

        const zoneRows = Array.from(new Set(zoneSeats.map(s => s.row))).sort();

        return (
          <div key={zone} className="border border-gray-600 rounded-lg p-4">
            <h4 className="text-center font-bold mb-2">{zone}</h4>
            {/* Encabezado de columnas */}
            <div className="grid grid-cols-11 gap-1 mb-2">
              <div></div>
              {[...Array(columnsCount)].map((_, i) => (
                <div key={i} className="text-center text-xs">{i + 1}</div>
              ))}
            </div>
            {/* Filas */}
            {zoneRows.map(row => (
              <div key={row} className="grid grid-cols-11 gap-1 items-center mb-1">
                <div className="text-xs text-center font-semibold">{row}</div>
                {zoneSeats.filter(seat => seat.row === row).map(seat => (
                  <button
                    key={`${seat.row}${seat.column}`}
                    type="button"
                    className={`w-6 h-6 text-xs rounded ${
                      seat.zone === "VIP"
                        ? "bg-purple-600"
                        : seat.zone === "General A"
                        ? "bg-orange-500"
                        : "bg-red-600"
                    } cursor-default`}
                    disabled
                  >
                    {seat.column}
                  </button>
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}


return (
  <div
    className="py-16 px-4 flex justify-center items-start min-h-screen bg-cover bg-center"
    style={{
      backgroundImage: `url('https://images.unsplash.com/photo-1655694775188-361234f2f5ed?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
    }}
  >
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-6xl bg-black/70 backdrop-blur-lg rounded-2xl shadow-lg p-8 space-y-8"
    >
      {/* Encabezado */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-white mb-2">Crear Nuevo Evento</h2>
        <p className="text-gray-400 max-w-xl mx-auto">
          Completa la información para que tu evento destaque y tus asistentes tengan la mejor experiencia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Columna Izquierda */}
        <div className="space-y-6">
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
              className="w-full px-4 py-3 rounded-2xl bg-black text-white border border-neutral-800"
            />
          </div>

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
              placeholder="Describe la experiencia..."
              className="w-full px-4 py-3 rounded-2xl bg-black text-white border border-neutral-800"
            />
          </div>

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
              className="w-full px-4 py-3 rounded-2xl bg-black text-white border border-neutral-800"
            />
          </div>

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
              className="w-full px-4 py-3 rounded-2xl bg-black text-white border border-neutral-800"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-lg font-medium text-gray-300 mb-2">
              Lugar del Evento
            </label>
            <select
              id="location"
              value={location}
              onChange={handleLocationChange}
              required
              className="w-full px-4 py-3 rounded-2xl bg-black text-white border border-neutral-800"
            >
              <option value="">Seleccionar Lugar</option>
              {LOCATIONS.map(loc => (
                <option key={loc.name} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Mapa de Asientos */}
          {seatMap.length > 0 && (
            <SeatGrid seats={seatMap} toggleSeat={toggleSeat} />
          )}
        </div>

        {/* Columna Derecha */}
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-gray-300 mb-2">
              Capacidad Total
            </label>
            <input
              type="number"
              value={totalSeats}
              readOnly
              className="w-full px-4 py-3 rounded-2xl bg-black text-white border border-neutral-800"
            />
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Configuración de Boletos</h3>

            {["vip", "generalA", "generalB"].map(type => (
              <div key={type}>
                <label className="block text-lg font-semibold text-gray-300 mb-2">
                  {type === "vip" ? "VIP" : type === "generalA" ? "General A" : "General B"}
                </label>
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      name={type}
                      value={prices[type]}
                      onChange={handlePriceChange}
                      placeholder={`Precio ${type}`}
                      min="0"
                      required
                      className="w-full pl-8 pr-4 py-3 rounded-2xl bg-black text-white border border-neutral-700"
                    />
                  </div>
                  <input
                    type="number"
                    name={type}
                    value={quantities[type]}
                    readOnly
                    className="w-full px-4 py-3 rounded-2xl bg-black text-white border border-neutral-700"
                  />
                </div>
              </div>
            ))}
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-lg transition duration-300"
          >
            Registrar Evento
          </button>
        </div>
      </div>
    </form>
  </div>
);
}

export default EventForm;
