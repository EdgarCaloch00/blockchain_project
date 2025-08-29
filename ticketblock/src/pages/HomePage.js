// src/pages/HomePage.js
import React, { useContext, useEffect, useState, useRef } from 'react';
import Slider from 'react-slick';
import { Link } from 'react-router-dom';
import { Web3Context } from './web3';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const ethers = require("ethers");
const EventsABI = require('../contractsABI/Events.json');
const TicketFactoryABI = require('../contractsABI/TicketFactory.json');
const SERVER_URL = process.env.REACT_APP_SERVER_URL;

function HomePage() {
  const { provider, signer, account } = useContext(Web3Context);

  const [events, setEvents] = useState([]);
  const [ethRateMXN, setEthRateMXN] = useState(null); // ETH -> MXN rate
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState("");
  const fetchedEthRate = useRef(false);

  // Fetch ETH to MXN rate once on mount via your Node.js proxy
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
    const fetchData = async () => {
      if (!provider || !signer || !account) {
        console.warn("Web3 context not fully initialized");
        return;
      }

      try {
        const networkId = 1337; // Ganache chain ID
        const eventContractAddress = EventsABI.networks[networkId]?.address;
        const ticketFactoryAddress = TicketFactoryABI.networks[networkId]?.address;

        if (!eventContractAddress || !ticketFactoryAddress) {
          console.error("Invalid or missing contract addresses");
          return;
        }

        const eventsContract = new ethers.Contract(eventContractAddress, EventsABI.abi, provider);
        const ticketFactoryContract = new ethers.Contract(ticketFactoryAddress, TicketFactoryABI.abi, provider);

        const eventsData = await eventsContract.displayEvents();

        const parsedEvents = await Promise.all(
          eventsData.map(async (event) => {
            const eventId = event.eventId;
            let lowestPrice = null;
            let lowestPriceMXN = null;

            try {
              const tickets = await ticketFactoryContract.getTicketsByEvent(eventId);
              const unsold = tickets.filter((ticket) => !ticket.sold);
              const prices = unsold.map((ticket) => parseFloat(ethers.utils.formatEther(ticket.price)));
              if (prices.length > 0) {
                lowestPrice = Math.min(...prices);
                if (ethRateMXN) {
                  lowestPriceMXN = (lowestPrice * ethRateMXN).toFixed(2);
                }
              }
            } catch (err) {
              console.warn(`Couldn't load tickets for event ${eventId}:`, err);
            }

            return {
              ...event,
              eventId,
              lowestPrice,
              lowestPriceMXN,
            };
          })
        );

        setEvents(parsedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchData();
  }, [provider, signer, account, ethRateMXN]);

  const settings = {
    dots: false,
    infinite: events.length > 3,
    speed: 700,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <main className="bg-black text-white font-sans">
      {/* HERO */}
      <section className="relative h-screen flex flex-col justify-center items-center text-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Hero Background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/70"></div>

        <div className="relative z-10 px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
            Feel the beat, live the night, see our events
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Your gateway to unforgettable nights. Buy or host events seamlessly on blockchain.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/events"
              className="inline-block bg-violet-500 hover:bg-violet-600 text-black font-bold px-8 py-3 rounded-full transition duration-300"
            >
              Descubre eventos
            </Link>
            <Link
              to="/register-event"
              className="inline-block border border-violet-400 hover:bg-violet-600 hover:text-black text-violet-400 font-bold px-8 py-3 rounded-full transition duration-300"
            >
              Publica tu Evento
            </Link>
          </div>
        </div>
      </section>

      {/* CAROUSEL */}
      {events.length > 0 && (
        <section className="py-20 w-full max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center text-white">
            Próximos Eventos
          </h2>

          <Slider {...settings}>
            {events.map((event, index) => {
              const eventDate = new Date(event.date * 1000);
              const day = eventDate.getDate().toString().padStart(2, "0");
              const month = eventDate.toLocaleString("default", { month: "short" });
              const year = eventDate.getFullYear();

              return (
                <div key={`${event.eventId.toNumber()}_${index}`} className="p-3">
                  <div className="bg-neutral-900 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition relative">
                    <div className="absolute top-3 left-3 bg-black/80 text-white px-2 py-1 rounded-md text-center z-10">
                      <p className="text-sm leading-none font-semibold">{day}</p>
                      <p className="text-[10px] uppercase">{month}</p>
                      <p className="text-[9px] text-gray-400">{year}</p>
                    </div>

                    <div className="h-56 overflow-hidden">
                      <img
                        src={event.imageUrl || "https://via.placeholder.com/400x300?text=No+Image"}
                        alt={event.title}
                        className="w-full h-full object-cover hover:scale-105 transition duration-300"
                      />
                    </div>

                    <div className="p-4">
                      <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                        <span>{event.place || "Lugar no especificado"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                        <span>
                          {event.lowestPrice !== null
                            ? `Desde ${event.lowestPrice.toFixed(5)} ETH${event.lowestPriceMXN ? ` (≈ $${event.lowestPriceMXN} MXN)` : ""}`
                            : "Boletos no disponibles"}
                        </span>
                      </div>

                      <Link
                        to={`/event/${event.eventId.toNumber()}`}
                        className="inline-block text-sm font-medium px-4 py-2 rounded-full bg-violet-500 hover:bg-violet-600 text-black transition duration-300"
                      >
                        Comprar Boleto
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </Slider>
        </section>
      )}
      {/* GRID DE EVENTOS */}
      <section className="w-full max-w-7xl mx-auto px-4 pt-10">
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
            className="text-sm px-5 py-3 bg-neutral-800 hover:bg-neutral-900 text-white rounded-full transition duration-200"
          >
            Limpiar
          </button>
        </div>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
            {events
              .filter((event) => event.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .filter((event) => (selectedPlace ? event.place === selectedPlace : true))
              .map((event, index) => {
                const eventDate = new Date(event.date * 1000);
                const day = eventDate.getDate().toString().padStart(2, "0");
                const month = eventDate.toLocaleString("default", { month: "short" });
                const year = eventDate.getFullYear();

                return (
                  <Link
                    to={`/event/${event.eventId.toNumber()}`}
                    key={`${event.eventId.toNumber()}_${index}_list`}
                    className="flex flex-row bg-black rounded-xl overflow-hidden group shadow-md hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={event.imageUrl || "https://via.placeholder.com/208x128?text=No+Image"}
                      alt={event.title}
                      className="w-52 h-32 object-cover rounded-xl"
                    />

                    <div className="p-4 flex flex-col justify-between text-white w-full">
                      <div>
                        <h3 className="text-lg md:text-xl font-bold group-hover:text-violet-400 transition">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-400">
                          <span className="text-gray-500 font-medium">Lugar:</span> {event.place || "No especificado"}
                        </p>
                        <p className="text-sm text-gray-400">
                          <span className="text-gray-500 font-medium">Fecha:</span> {`${day} ${month} ${year}`}
                        </p>
                        <p className="text-sm text-gray-500 font-semibold">
                          {event.lowestPrice !== null
                            ? `Desde ${event.lowestPrice.toFixed(5)} ETH${event.lowestPriceMXN ? ` (≈ $${event.lowestPriceMXN} MXN)` : ""}`
                            : "Boletos no disponibles"}
                        </p>
                      </div>
                      <span className="mt-2 text-sm text-violet-400 font-medium group-hover:underline">
                        Adquirir boletos
                      </span>
                    </div>
                  </Link>
                );
              })}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-lg">No events available</p>
        )}
      </section>
    </main>
  );
}

export default HomePage;
