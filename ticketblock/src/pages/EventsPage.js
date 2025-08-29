import React, { useEffect, useState, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Web3Context } from './web3';
const ethers = require('ethers');
const EventsABI = require('../contractsABI/Events.json');
const TicketFactoryABI = require('../contractsABI/TicketFactory.json');
const SERVER_URL = process.env.REACT_APP_SERVER_URL;

const EventsPage = () => {
  const { provider, signer, account } = useContext(Web3Context);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState("");

  // ETH -> MXN
  const [ethRateMXN, setEthRateMXN] = useState(null);
  const fetchedEthRate = useRef(false);

  useEffect(() => {
    if (fetchedEthRate.current) return;
    fetchedEthRate.current = true;

    async function fetchEthRate() {
      try {
        const res = await fetch(`/api/eth-rate`);
        if (!res.ok) throw new Error(`Failed to fetch ETH rate: ${res.status}`);
        const data = await res.json();
        setEthRateMXN(data.ethereum.mxn);
      } catch (err) {
        console.error("Failed to fetch ETH rate:", err);
      }
    }

    fetchEthRate();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!provider || !signer || !account) {
        console.warn("Web3 not initialized properly");
        return;
      }

      setLoading(true);

      try {
        const networkId = 1337;
        const eventContractAddress = EventsABI.networks[networkId]?.address;
        const ticketFactoryAddress = TicketFactoryABI.networks[networkId]?.address;

        if (!eventContractAddress || !ticketFactoryAddress) {
          console.error("Missing contract address");
          setLoading(false);
          return;
        }

        const eventsContract = new ethers.Contract(eventContractAddress, EventsABI.abi, provider);
        const ticketFactoryContract = new ethers.Contract(ticketFactoryAddress, TicketFactoryABI.abi, signer);

        const rawEvents = await eventsContract.displayEvents();

        const upcoming = rawEvents.filter((event) => new Date(event.date * 1000) >= new Date());

        const parsed = await Promise.all(
          upcoming.map(async (event) => {
            const eventId = event.eventId.toNumber();
            const availableSeats = Number(event.availableSeats);

            let lowestPrice = null;

            try {
              const tickets = await ticketFactoryContract.getTicketsByEvent(eventId);
              const unsold = tickets.filter((ticket) => !ticket.sold);
              const prices = unsold.map((ticket) => parseFloat(ethers.utils.formatEther(ticket.price)));
              lowestPrice = prices.length > 0 ? Math.min(...prices) : null;
            } catch (ticketErr) {
              console.warn(`Couldn't load tickets for event ${eventId}:`, ticketErr);
            }

            // Convert to MXN if ETH rate available
            const lowestPriceMXN = lowestPrice && ethRateMXN
              ? (lowestPrice * ethRateMXN).toFixed(2)
              : null;

            return {
              eventId,
              title: event.title,
              location: event.place,
              date: new Date(event.date * 1000).toLocaleDateString(),
              time: new Date(event.date * 1000).toLocaleTimeString(),
              availableSeats,
              category: event.category,
              lowestPrice,
              lowestPriceMXN,
              imageUrl: event.imageUrl
            };
          })
        );

        setEvents(parsed);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }

      setLoading(false);
    };

    fetchEvents();
  }, [provider, signer, account, ethRateMXN]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-neutral-950 text-white">
        <div className="animate-spin h-16 w-16 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-lg text-neutral-300">Cargando eventos disponibles...</p>
      </div>
    );
  }

  const filteredEvents = events
    .filter((event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((event) =>
      selectedPlace ? event.place === selectedPlace : true
    );

  const uniquePlaces = [...new Set(events.map((e) => e.place || "Desconocido"))];

  return (
    <div className="pt-20 pb-6 px-6 mx-auto lg:px-16 bg-neutral-950 min-h-screen text-white">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-black text-white hover:bg-zinc-950 transition z-50 shadow-md"
      >
        Regresar
      </button>
      <h1 className="text-3xl font-semibold text-start py-3">
        Descubre los próximos eventos
      </h1>

      {/* Buscador y limpiar filtros */}
      <div className="mb-6 flex flex-row md:flex-row gap-3 items-center">
        <input
          type="text"
          placeholder="Buscar evento por título..."
          className="flex-1 px-5 py-2 rounded-full bg-neutral-800 text-white border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-gray-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          onClick={() => {
            setSearchQuery("");
            setSelectedPlace("");
          }}
          className="text-sm px-5 py-2.5 bg-neutral-800 hover:bg-neutral-900 text-white rounded-full transition duration-200"
        >
          Limpiar
        </button>
      </div>

      {/* Lista de eventos */}
      {filteredEvents.length === 0 ? (
        <p className="text-center text-neutral-400">No hay eventos próximamente.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredEvents.map((event, index) => {
            let availability = "";
            let tagColor = "";

            if (event.availableSeats === 0) {
              availability = "Agotado";
              tagColor = "bg-red-600 text-white";
            } else if (event.availableSeats <= 10) {
              availability = "Últimos boletos";
              tagColor = "bg-yellow-500 text-black";
            } else if (event.lowestPrice !== null) {
              availability = `Desde ${event.lowestPrice.toFixed(5)} ETH${event.lowestPriceMXN ? ` (≈ $${event.lowestPriceMXN} MXN)` : ""}`;
              tagColor = "bg-green-600 text-white";
            } else {
              availability = "Boletos disponibles";
              tagColor = "bg-neutral-700 text-white";
            }

            return (
              <Link
                to={`/event/${event.eventId}`}
                key={`event_${event.eventId}_${index}`}
                className="flex flex-col md:flex-row bg-neutral-950 hover:bg-neutral-900 transition rounded-xl overflow-hidden group"
              >
                <img
                  src={
                    event.imageUrl ||
                    "https://via.placeholder.com/800x600?text=No+Image"
                  }
                  alt={event.title}
                  className="w-full md:w-52 h-auto object-cover md:rounded-l-xl"
                />

                <div className="p-4 flex flex-col justify-between text-white w-full">
                  <div>
                    <h2 className="text-xl font-bold text-white group-hover:text-violet-400 transition">
                      {event.title}
                    </h2>
                    <p className="text-sm text-neutral-400 mb-1">
                      {event.time} - {event.place || event.category}
                    </p>
                    <p className="text-sm text-neutral-300 mb-2">
                      Fecha: {`${event.date}`}
                    </p>
                    <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${tagColor}`}>
                      {availability}
                    </span>
                  </div>
                  <span className="mt-2 text-sm text-violet-400 font-medium group-hover:underline">
                    {event.availableSeats === 0 ? "No disponible" : "Adquirir boletos"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
