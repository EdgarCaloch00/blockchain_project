import React, { useContext, useEffect, useState, useRef } from 'react';
import { Web3Context } from '../pages/web3';
import { FiCalendar, FiClock } from "react-icons/fi";
const ethers = require("ethers");
const EventsABI = require('../contractsABI/Events.json');
const TicketFactoryABI = require('../contractsABI/TicketFactory.json');
const SERVER_URL = process.env.REACT_APP_SERVER_URL;
console.log("Server URL:", SERVER_URL);



const LOCATIONS = [
  {
    name: "Estadio GNP",
    totalSeats: 30,
    quantities: { vip: 10, generalA: 10, generalB: 10 },
    seatsPerRow: { vip: 10, generalA: 10, generalB: 10 } // ✅ valid
  },
  {
    name: "Arena CDMX",
    totalSeats: 40,
    quantities: { vip: 10, generalA: 10, generalB: 20 },
    seatsPerRow: { vip: 5, generalA: 5, generalB: 10 } // ✅ valid
  },
  {
    name: "Foro Sol",
    totalSeats: 30,
    quantities: { vip: 5, generalA: 10, generalB: 15 },
    seatsPerRow: { vip: 5, generalA: 5, generalB: 5 } // ✅ fixed from original
  }]

const CATEGORIES = [
  "Concierto de Música",
  "Evento de Teatro",
  "Exposición de Arte",
  "Evento Deportivo",
  "Show de Comedia"
];

// Dynamic seat map generator:
const generateDynamicSeatMap = (seatQuantities, seatsPerRowConfig) => {
  const zones = ["vip", "generalA", "generalB"];
  const zoneLabels = { vip: "VIP", generalA: "General A", generalB: "General B" };

  const seatMap = [];

  zones.forEach(zone => {
    const quantity = seatQuantities[zone];
    const seatsPerRow = seatsPerRowConfig[zone];
    if (quantity === 0 || seatsPerRow === 0) return;

    const rowsCount = Math.ceil(quantity / seatsPerRow);

    for (let row = 1; row <= rowsCount; row++) {
      const rowLabel = row.toString(); // Numeric row label

      const seatsInThisRow = Math.min(seatsPerRow, quantity - (row - 1) * seatsPerRow);
      for (let seatNumber = 1; seatNumber <= seatsInThisRow; seatNumber++) {
        seatMap.push({
          zone: zoneLabels[zone],
          row: rowLabel,
          column: seatNumber,
          selected: true,
        });
      }
    }
  });

  return seatMap;
};

function EventForm() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [eventsContract, setEventsContract] = useState(null);
  const [ticketFactoryContract, setTicketFactoryContract] = useState(null);
  const [showLoader, setShowLoader] = useState(false);
  const { provider, signer, account } = useContext(Web3Context);

  useEffect(() => {
    const fetchData = async () => {
      if (!provider || !signer || !window.ethereum) return;

      try {
        const networkId = 1337;

        const eventContractAddress = EventsABI.networks[networkId].address;
        const eventsContractABI = EventsABI.abi;
        // Create contract connected to signer directly
        const connectedEventsContract = new ethers.Contract(eventContractAddress, eventsContractABI, signer);

        const ticketFactoryContractAddress = TicketFactoryABI.networks[networkId].address;
        const ticketFactoryContractABI = TicketFactoryABI.abi;
        const connectedTicketFactoryContract = new ethers.Contract(ticketFactoryContractAddress, ticketFactoryContractABI, signer);

        // Store contracts connected to signer so you can call write methods directly
        setEventsContract(connectedEventsContract);
        setTicketFactoryContract(connectedTicketFactoryContract);

      } catch (error) {
        console.error('Error fetching contracts:', error);
      }
    };

    fetchData();
  }, [provider, signer]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [resellable, setResellable] = useState(false);
  const [totalSeats, setTotalSeats] = useState('');
  const [prices, setPrices] = useState({ vip: '', generalA: '', generalB: '' });
  const [quantities, setQuantities] = useState({ vip: 0, generalA: 0, generalB: 0 });
  const [seatsPerRow, setSeatsPerRow] = useState({ vip: 0, generalA: 0, generalB: 0 });
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

  const [ethRate, setEthRate] = useState(null);
  // Ref to ensure ETH rate fetch only once per mount/session
  const fetchedEthRate = useRef(false);
  useEffect(() => {
    if (fetchedEthRate.current) return;
    fetchedEthRate.current = true;

    async function fetchEthRate() {
      try {
        const res = await fetch(`${SERVER_URL}/api/eth-rate`);
        if (!res.ok) throw new Error(`Failed to fetch ETH rate: ${res.status}`);
        const data = await res.json();
        setEthRate(data.ethereum.mxn);
      } catch (err) {
        console.error("Failed to fetch ETH rate:", err);
      }
    }
    fetchEthRate();
  }, []);

  const handleLocationChange = (e) => {
    const selectedName = e.target.value;
    setLocation(selectedName);
    const found = LOCATIONS.find(loc => loc.name === selectedName);
    if (found) {
      setTotalSeats(found.totalSeats);
      setQuantities(found.quantities);
      setSeatsPerRow(found.seatsPerRow);
      setSeatMap(generateDynamicSeatMap(found.quantities, found.seatsPerRow));
    } else {
      setTotalSeats('');
      setQuantities({ vip: 0, generalA: 0, generalB: 0 });
      setSeatsPerRow({ vip: 0, generalA: 0, generalB: 0 });
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

  const handleSubmit = () => {
    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    if (!eventsContract || isSubmitting) return;

    setShowConfirmation(false);
    setShowLoader(true);
    setIsSubmitting(true);

    const currentDate = new Date();
    const eventDate = new Date(date);
    const totalTickets = quantities.vip + quantities.generalA + quantities.generalB;

    if (eventDate < currentDate.setHours(0, 0, 0, 0)) {
      alert('La fecha del evento no puede ser en el pasado.');
      setHighlightedField('date');
      setIsSubmitting(false);
      setShowLoader(false);
      return;
    }

    if (totalTickets > totalSeats) {
      alert('La suma de boletos no puede ser mayor que la capacidad de asientos del recinto.');
      setHighlightedField('totalSeats');
      setIsSubmitting(false);
      setShowLoader(false);
      return;
    }

    try {
      // 1️⃣ Upload image if available
      let imageUrl = "";
      if (image) {
        // Convert image file to Base64
        const reader = new FileReader();
        const imageBase64 = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result); // full Data URL
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });

        // Upload to backend
        const uploadResponse = await fetch(`${SERVER_URL}/api/upload-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64 })
        });
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.imageUrl;
        console.log("Uploaded image URL:", imageUrl);
      }

      // 2️⃣ Create the event on blockchain with image URL
      await eventsContract.createEvent(
        title,
        description,
        category,
        location,
        Math.floor(eventDate.getTime() / 1000),
        imageUrl
      );

      // 3️⃣ Get new event ID
      const totalEvents = await eventsContract.getEventsCount();
      const newEventId = totalEvents.toNumber();

      // 4️⃣ Generate tickets
      const vipPriceEth = (prices.vip / ethRate).toString();
      const generalAPriceEth = (prices.generalA / ethRate).toString();
      const generalBPriceEth = (prices.generalB / ethRate).toString();

      await ticketFactoryContract.generateEventTickets(
        newEventId,
        quantities.vip,
        ethers.utils.parseEther(vipPriceEth),
        seatsPerRow.vip,
        quantities.generalA,
        ethers.utils.parseEther(generalAPriceEth),
        seatsPerRow.generalA,
        quantities.generalB,
        ethers.utils.parseEther(generalBPriceEth),
        seatsPerRow.generalB,
        resellable
      );

      alert("¡Evento creado con éxito!");
      window.location.reload();

    } catch (error) {
      console.error('Error al crear el evento:', error);
    } finally {
      setIsSubmitting(false);
      setShowLoader(false);
    }
  };


  function SeatGrid({ seats }) {
    // Determine max columns needed per zone to help center grids individually
    const zones = ["VIP", "General A", "General B"];

    return (
      <div className="space-y-4 text-white">
        {zones.map((zone) => {
          const zoneSeats = seats.filter((s) => s.zone === zone);
          if (zoneSeats.length === 0) return null;

          // Seats per row for this zone (dynamic per your seat data)
          const columnsCount = Math.max(...zoneSeats.map((s) => s.column));
          const zoneRows = Array.from(new Set(zoneSeats.map((s) => s.row))).sort();

          return (
            <div key={zone} className="border border-gray-600 rounded-lg flex flex-col items-center">
              <h4 className="text-center font-bold mb-2">{zone}</h4>

              {/* Column headers */}
              <div
                className="grid gap-1 mb-2"
                style={{ gridTemplateColumns: `auto repeat(${columnsCount}, auto)` }}
              >
                <div className="mx-1"></div>
                {[...Array(columnsCount)].map((_, i) => (
                  <button
                    disabled
                    key={i}
                    className="w-6 h-7 text-center text-xs text-gray-300"
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* Rows */}
              {zoneRows.map((row) => (
                <div
                  key={row}
                  className="grid gap-1 items-center mb-2"
                  style={{ gridTemplateColumns: `auto repeat(${columnsCount}, auto)` }}
                >
                  <div className="text-xs text-center font-semibold">{row}</div>
                  {Array.from({ length: columnsCount }, (_, i) => {
                    const seat = zoneSeats.find(
                      (s) => s.row === row && s.column === i + 1
                    );
                    return seat ? (
                      <button
                        key={`${seat.row}${seat.column}`}
                        type="button"
                        className={`w-6 h-6 text-xs rounded cursor-default ${seat.zone === "VIP"
                          ? "bg-purple-600"
                          : seat.zone === "General A"
                            ? "bg-orange-500"
                            : "bg-red-600"
                          }`}
                        disabled
                      >
                        {seat.column}
                      </button>
                    ) : (
                      <div key={`empty-${row}-${i + 1}`} className="w-6 h-6" />
                    );
                  })}
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
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="w-full max-w-6xl bg-black/70 backdrop-blur-lg rounded-2xl shadow-lg p-8 space-y-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white mb-2">Crear Nuevo Evento</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Completa la información para que tu evento destaque y tus asistentes tengan la mejor experiencia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
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

            {/* Fecha */}
            <div className="relative">
              <label htmlFor="date" className="block text-lg font-medium text-gray-300 mb-2">
                Fecha del Evento
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white opacity-70 pointer-events-none z-10" />
                <input
                  type="date"
                  id="date"
                  value={date}
                  min={today}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-black text-white border border-neutral-800 appearance-none relative z-0"
                  style={{
                    colorScheme: 'dark'
                  }}
                />
              </div>
            </div>


            {/* Hora */}
            <div className="relative">
              <label htmlFor="time" className="block text-lg font-medium text-gray-300 mb-2">
                Hora de Inicio
              </label>
              <div className="relative">
                <FiClock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white opacity-70 pointer-events-none z-10" />
                <input
                  type="time"
                  id="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-black text-white border border-neutral-800 appearance-none relative z-0"
                  style={{
                    colorScheme: 'dark'
                  }}
                />
              </div>
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

            {/* Seat map display */}
            {seatMap.length > 0 && (
              <SeatGrid seats={seatMap} toggleSeat={toggleSeat} />
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label htmlFor="category" className="block text-lg font-medium text-gray-300 mb-2">
                Categoría del Evento
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-2xl bg-black text-white border border-neutral-800 appearance-none relative z-0"
              >
                <option value="">Seleccionar Categoría</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
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

              {["vip", "generalA", "generalB"].map(type => {
                const ethValue =
                  ethRate && prices[type]
                    ? (prices[type] / ethRate).toFixed(6)
                    : "—";

                return (
                  <div key={type}>
                    <label className="block text-lg font-semibold text-gray-300 mb-2">
                      {type === "vip" ? "VIP" : type === "generalA" ? "General A" : "General B"}
                    </label>
                    <div className="flex flex-col gap-4">
                      <div className="relative flex items-center gap-3">
                        <div className="relative flex-1">
                          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                          <input
                            type="number"
                            name={type}
                            value={prices[type]}
                            onChange={handlePriceChange}
                            placeholder={`Precio ${type} (MXN)`}
                            min="0"
                            required
                            className="w-full pl-8 pr-4 py-3 rounded-2xl bg-black text-white border border-neutral-700"
                          />
                        </div>
                        <span className="text-gray-400 text-sm whitespace-nowrap">{ethValue} ETH</span>
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
                );
              })}
            </div>

            {/* Imagen */}
            <div>
              <label
                htmlFor="image"
                className="inline-block px-4 py-2 bg-violet-500 hover:bg-violet-600 transition text-black font-semibold rounded-full cursor-pointer text-sm"
              >
                {image ? "Cambiar Imagen" : "Seleccionar Imagen"}
              </label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
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
      {/* Modal de confirmación */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl w-full max-w-xl space-y-6 shadow-xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-bold text-center text-black dark:text-white">¿Confirmar creación del evento?</h3>
            <p className="text-gray-700 dark:text-gray-300 text-center">Revisa los detalles antes de continuar:</p>

            <div className="space-y-3 text-sm text-gray-800 dark:text-gray-200">
              <p><strong>Título:</strong> {title}</p>
              <p><strong>Descripción:</strong> {description}</p>
              <p><strong>Fecha:</strong> {date}</p>
              <p><strong>Hora:</strong> {time}</p>
              <p><strong>Lugar:</strong> {location}</p>
              <p><strong>Capacidad Total:</strong> {totalSeats}</p>

              <div>
                <strong>Precios por zona:</strong>
                <ul className="pl-4 list-disc">
                  {Object.entries(prices).map(([zone, price]) => (
                    <li key={zone}>
                      {zone === "vip" ? "VIP" : zone === "generalA" ? "General A" : "General B"}: ${price} MXN ({quantities[zone]} boletos)
                    </li>
                  ))}
                </ul>
              </div>

              <p><strong>Reventa permitida:</strong> {resellable ? "Sí" : "No"}</p>

              {imagePreview && (
                <div className="mt-4">
                  <strong>Imagen seleccionada:</strong>
                  <img src={imagePreview} alt="Vista previa" className="mt-2 w-full h-auto rounded-xl border border-neutral-700" />
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-5 py-2 bg-gray-300 hover:bg-gray-400 text-black font-medium rounded-xl"
              >
                Seguir editando
              </button>
              <button
                onClick={confirmSubmit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl"
              >
                Crear Evento
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Loader */}
      {showLoader && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex flex-col items-center justify-center text-white">
          <div className="animate-spin rounded-full h-24 w-24 border-8 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-lg">Registrando evento...</p>
        </div>
      )}
    </div>

  );
}

export default EventForm;