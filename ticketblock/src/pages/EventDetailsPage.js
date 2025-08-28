// src/pages/EventDetailsPage.js
import { useParams } from 'react-router-dom';
import SeatingMap from '../components/SeatingMap';
import '../styles/eventDetail.css';
import TicketForm from '../components/TicketForm';
import { Web3Context } from './web3';
import React, { useContext, useEffect, useState } from 'react';
const EventsABI = require('../contractsABI/Events.json');
const TicketFactoryABI = require('../contractsABI/TicketFactory.json');
const ethers = require("ethers");

function EventDetailsPage() {
  const { id } = useParams();
  const { provider, signer } = useContext(Web3Context);
  const [eventDetail, setEventDetail] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [showSeatingMap, setShowSeatingMap] = useState(false);
  const [seatFilter, setSeatFilter] = useState("");
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!provider) return;

      const networkId = 1337; // Change as needed

      try {
        // Use signer if available, otherwise fallback to provider
        const eventsContractSignerOrProvider = signer || provider;

        // 1. Load Events contract connected to signer or provider
        const eventContractAddress = EventsABI.networks[networkId]?.address;
        if (!eventContractAddress) {
          throw new Error("Invalid Events contract address for network " + networkId);
        }
        const eventsContract = new ethers.Contract(eventContractAddress, EventsABI.abi, eventsContractSignerOrProvider);

        // 2. Fetch event detail
        const event = await eventsContract.getEvent(id);
        setEventDetail({
          eventId: event.eventId.toNumber(),
          title: event.title,
          description: event.description,
          category: event.category,
          place: event.place,
          date: new Date(event.date.toNumber() * 1000).toLocaleString(), // UNIX timestamp to string
          ticketsSold: event.ticketsSold.toNumber(),
          isActive: event.isActive,
          imageUrl: event.imageUrl,
        });

        // 3. Load TicketFactory contract connected to signer or provider
        const ticketFactoryContractAddress = TicketFactoryABI.networks[networkId]?.address;
        if (!ticketFactoryContractAddress) {
          throw new Error("Invalid TicketFactory contract address for network " + networkId);
        }
        const ticketFactoryContract = new ethers.Contract(ticketFactoryContractAddress, TicketFactoryABI.abi, eventsContractSignerOrProvider);

        // 4. Fetch tickets for the event
        const eventTickets = await ticketFactoryContract.getTicketsByEvent(id);
        console.log(eventTickets);
        const parsedTickets = eventTickets.map(ticket => ({
          eventId: ticket.eventId.toNumber(),
          ticketId: ticket.ticketId.toNumber(),
          price: ethers.utils.formatEther(ticket.price),
          zone: ticket.ticketType,
          owner: ticket.owner,
          resellable: ticket.resellable,
          sold: ticket.sold,
          scanned: ticket.scanned,
          row: ticket.row.toNumber(),
          column: ticket.column.toNumber()
        }));

        console.log("Raw ticketsByEvent from contract:", eventTickets);


        setTickets(parsedTickets);
        setLoadingTickets(false);

      } catch (error) {
        console.error("Error fetching event detail or tickets:", error);
        setEventDetail({ error: "Evento no existe o error al cargar" });
        setLoadingTickets(false);

      }
    };

    fetchData();
  }, [provider, signer, id]);

  if (!eventDetail) return <p className="text-center mt-20 text-gray-300">Cargando...</p>;
  if (eventDetail.error) return <p className="text-center mt-20 text-red-500">{eventDetail.error}</p>;

  const filteredTickets = tickets.filter(
    t => !t.sold && (seatFilter === "" || t.ticketType === seatFilter)
  );

  const isSoldOut = tickets.filter(t => !t.sold).length === 0;

  return (
    <div className="bg-black text-gray-100 font-sans min-h-screen p-4 md:p-8">
      {/* Header con imagen degradada */}
      <div className="relative mb-8 rounded-xl overflow-hidden shadow-2xl border border-gray-700 max-w-7xl mx-auto">
        <img
          src={eventDetail.imageUrl || "/placeholder.jpg"}
          alt={eventDetail.title}
          className="w-full h-64 sm:h-80 md:h-96 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute bottom-4 left-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">{eventDetail.title}</h1>
          <p className="text-gray-200 mt-1 sm:mt-2 text-sm sm:text-base">{eventDetail.description}</p>
        </div>
      </div>

      {/* Detalles del evento */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-300 mb-8">
        <p><span className="font-semibold text-gray-200">Categoría:</span> {eventDetail.category}</p>
        <p><span className="font-semibold text-gray-200">Fecha:</span> {eventDetail.date}</p>
        <p><span className="font-semibold text-gray-200">Lugar:</span> {eventDetail.place}</p>
        <p><span className="font-semibold text-gray-200">Entradas vendidas:</span> {eventDetail.ticketsSold}</p>
        <p className="sm:col-span-2">
          <span className="font-semibold text-gray-200">Estatus:</span>{" "}
          <span className={eventDetail.isActive ? "text-indigo-400 font-medium" : "text-gray-100 font-medium"}>
            {eventDetail.isActive ? "Disponible para compra" : "No disponible"}
          </span>
        </p>
      </div>

      {/* Loader */}
      {loadingTickets ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="mx-auto flex flex-col lg:flex-row gap-8">
          {/* SeatingMap */}
          <div className="lg:w-3/5 bg-neutral-950 rounded-xl p-4 border border-gray-800 shadow-lg">
            <SeatingMap
              availableSeats={filteredTickets}
              totalSeats={tickets.length}
              savedSeats={selectedSeats}
              onConfirm={(seats) => setSelectedSeats(seats)}
            />
          </div>

          {/* Panel de selección */}
          <div className="lg:w-2/5 bg-neutral-900 rounded-xl p-6 border border-gray-800 shadow-lg flex flex-col gap-4">
            <h3 className="text-2xl font-semibold text-white mb-4">Tus asientos seleccionados</h3>
            {selectedSeats.length === 0 ? (
              <p className="text-gray-400">No has seleccionado ningún asiento.</p>
            ) : (
              <ul className="space-y-4 max-h-[600px] overflow-auto">
                {selectedSeats.map((seat, i) => (
                  <li
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-inner"
                  >
                    <div>
                      <p className="text-sm text-white font-medium">{seat.zone}</p>
                      <p className="text-gray-300">Fila {seat.row}, Asiento {seat.column}</p>
                    </div>
                    <div className="mt-3 sm:mt-0">
                      <TicketForm
                        eventDetail={eventDetail}
                        ticket={seat}
                        onSubmit={(formData) => console.log("Compra confirmada:", formData)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDetailsPage;
