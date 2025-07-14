// src/pages/HomePage.js
import React, { useContext, useEffect, useState } from 'react';
import Slider from 'react-slick';
import { Link } from 'react-router-dom';
import { Web3Context } from './web3';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const ethers = require("ethers");
const EventsABI = require('../contractsABI/Events.json');

function HomePage() {
  const provider = useContext(Web3Context);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!provider) return;

      try {
        const networkId = 5777; // tu networkId de ganache
        const eventContractAddress = EventsABI.networks[networkId]?.address;

        if (!eventContractAddress) {
          console.error("Invalid contract address");
          return;
        }

        const eventsContract = new ethers.Contract(eventContractAddress, EventsABI.abi, provider);
        const eventsData = await eventsContract.displayEvents();
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [provider]);

  // Ejemplos por si no hay eventos aún:
  const exampleEvents = [
    { eventId: { toNumber: () => 9991 }, title: "Festival Beats", date: Date.now() / 1000 },
    { eventId: { toNumber: () => 9992 }, title: "Summer Night Live", date: Date.now() / 1000 },
    { eventId: { toNumber: () => 9993 }, title: "Electric Dreams", date: Date.now() / 1000 },
  ];

  const allEvents = events.length ? events : exampleEvents;

  const settings = {
    dots: false,
    infinite: true,
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
              Ver Eventos
            </Link>
            <Link
              to="/register-event"
              className="inline-block border border-violet-400 hover:bg-violet-600 hover:text-black text-violet-400 font-bold px-8 py-3 rounded-full transition duration-300"
            >
              Crear Evento
            </Link>
          </div>
        </div>
      </section>

      {/* CARRUSEL */}
      <section className="py-20 w-full max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center text-white">
          Próximos Eventos
        </h2>

        <Slider {...settings}>
  {allEvents.map((event, index) => {
    const isExample = event.eventId.toNumber() >= 9999; // ID >= 9990 => ejemplo
    return (
      <div key={event.eventId.toNumber() + "_" + index} className="p-3">
        <div className="bg-neutral-900 rounded-xl overflow-hidden shadow hover:shadow-xl transition duration-300 relative">
          {/* Sold Out Badge si es de ejemplo */}
          {isExample && (
            <div className="absolute top-3 left-3 bg-red-600 text-xs font-bold px-3 py-1 rounded-full z-50">
              SOLD OUT
            </div>
          )}

          <div className="h-60 overflow-hidden">
            <img
              src={`https://images.unsplash.com/photo-1619229667009-e7e51684e8e6?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`}
              alt={event.title}
              className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
            />
          </div>
          <div className="p-5">
            <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
            <p className="text-gray-400 mb-4">
              Fecha:{" "}
              {new Date(event.date * 1000).toLocaleDateString()}
            </p>
            <Link
              to={`/event/${event.eventId.toNumber()}`}
              className={`inline-block text-sm font-medium ${
                isExample
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-cyan-500 hover:bg-cyan-600"
              } text-black px-4 py-2 rounded-full transition duration-300`}
            >
              {isExample ? "No disponible" : "Comprar Boleto"}
            </Link>
          </div>
        </div>
      </div>
    );
  })}
</Slider>

      </section>
    </main>
  );
}

export default HomePage;