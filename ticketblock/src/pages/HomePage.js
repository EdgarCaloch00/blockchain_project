// src/pages/HomePage.js

import React, { useContext, useEffect, useState } from 'react';
import Slider from 'react-slick';
import { Link } from 'react-router-dom';
import { Web3Context } from './web3';
import '../styles/homepage.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import imagen1 from '../assets/images/evento1.jpeg';


const ethers = require("ethers");
const EventsABI = require('../contractsABI/Events.json');
const TicketsFactoryABI = require('../contractsABI/TicketFactory.json');

function NextArrow(props) {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: "block", background: "#007bff", borderRadius: "50%", padding: "10px", zIndex: 1 }}
      onClick={onClick}
    />
  );
}

function PrevArrow(props) {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: "block", background: "#007bff", borderRadius: "50%", padding: "10px", zIndex: 1 }}
      onClick={onClick}
    />
  );
}


function HomePage() {
  const provider = useContext(Web3Context);
  const [events, setEvents] = useState([]);


  useEffect(() => {
    const fetchData = async () => {
      if (!provider) return;

      try {
        const networkId = 5777; // Change this if your network ID is different
        const eventContractAddress = EventsABI.networks[networkId]?.address;
        const ticketFactoryContractAddress = TicketsFactoryABI.networks[networkId]?.address;
  
        if (!eventContractAddress || !ticketFactoryContractAddress) {
          console.error("Invalid contract address");
          return;
        }
  
        const eventsContract = new ethers.Contract(eventContractAddress, EventsABI.abi, provider);
        const eventsData = await eventsContract.displayEvents();
        setEvents(eventsData);
  
        const totalEvents = await eventsContract.getEventsCount();
        console.log("Total Events:", totalEvents.toNumber());
  
        const ticketFactoryContract = new ethers.Contract(ticketFactoryContractAddress, TicketsFactoryABI.abi, provider);
        const item = await ticketFactoryContract.getTicketsByEvent(0);
        console.log(item);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [provider]);
  

  const settings = {
    dots: true,
    infinite: true,
    speed: 1500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
          dots: true
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

  return (
    <main className="homepage">
      <section className="hero">
        <h1 className="homepage-title">Bienvenido a TicketBlock</h1>
        <p className="homepage-description">Compra tus boletos para eventos de música, teatro y más.</p>
        <Link to="/events" className="button">Ver Eventos</Link>
      </section>
      <section className="events">
        <h2 className="section-title">Próximos Eventos</h2>
        <Slider {...settings}>
          {events.map(event => (
            <div key={event.eventId.toNumber()} className="event-card-wrapper">
              <div className="event-card">
                <div className="event-info">
                <h3>{event.eventId.toNumber()}</h3>
                  <h3>{event.title}</h3>
                  <p>Fecha: {new Date(event.date * 1000).toLocaleDateString()}</p>
                  <Link 
                    to={`/event/${event.eventId.toNumber()}`} 
                    className={`button`}
                  >
                  {'Comprar Boletos'}
                  </Link>

                </div>
              </div>
            </div>
          ))}
        </Slider>
      </section>
    </main>
  );
}

export default HomePage;
