import React, { useState } from 'react';

function Scanner() {
  const [scanning, setScanning] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState('scanned'); // 'scanned' o 'summary'

  // Datos simulados
  const events = [
    {
      name: 'Festival de Música 2025',
      totalTickets: 100,
      scanned: [
        { id: 'QR1234567890', date: '27/07/2025 18:03' },
        { id: 'QR0987654321', date: '27/07/2025 18:08' },
        { id: 'QR1122334455', date: '27/07/2025 18:15' },
      ],
    },
    {
      name: 'Conferencia Blockchain',
      totalTickets: 80,
      scanned: [
        { id: 'QR6677889900', date: '27/07/2025 10:25' },
        { id: 'QR5566778899', date: '27/07/2025 10:37' },
      ],
    },
  ];

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setScanning(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center bg-cover bg-center px-4 py-12 mt-12"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1618601208185-f6ff920d961c?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
      }}
    >
      {/* Selección de evento */}
      <div className="max-w-5xl w-full mb-10 text-white">
        <h2 className="text-3xl font-bold text-center text-violet-400 mb-4">Escaneo de Tickets</h2>
        <p className="text-center text-gray-300 mb-6">
          Selecciona uno de tus eventos para comenzar a escanear los boletos.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          {events.map((event, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectEvent(event)}
              className={`px-6 py-4 rounded-xl text-lg font-semibold transition duration-300 ${
                selectedEvent?.name === event.name
                  ? 'bg-violet-600 text-white'
                  : 'bg-neutral-800 hover:bg-violet-500 text-gray-200'
              }`}
            >
              {event.name}
            </button>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <>
          {/* Escaneo y resumen */}
          <div className="max-w-5xl w-full bg-black/70 backdrop-blur-md rounded-2xl shadow-lg p-8 text-white flex flex-col md:flex-row gap-8 mb-10">
            {/* Lado izquierdo */}
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-violet-300 mb-2">
                Evento seleccionado:
              </h3>
              <p className="text-lg text-white font-semibold mb-1">
                {selectedEvent.name}
              </p>
              <p className="text-gray-300 mb-4">
                Escanea los boletos en la entrada para validar a los asistentes.
              </p>

              <div className="bg-neutral-900 p-4 rounded-lg text-sm mb-6">
                <p><span className="text-violet-400 font-semibold">Boletos vendidos:</span> {selectedEvent.totalTickets}</p>
                <p><span className="text-green-400 font-semibold">Escaneados:</span> {selectedEvent.scanned.length}</p>
                <p><span className="text-yellow-400 font-semibold">Faltantes:</span> {selectedEvent.totalTickets - selectedEvent.scanned.length}</p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setScanning(true)}
                  className="py-3 bg-violet-600 hover:bg-violet-700 rounded-2xl text-white font-semibold text-lg"
                  disabled={scanning}
                >
                  Escanear Ticket QR
                </button>
                <button
                  onClick={() => setScanning(false)}
                  className="py-3 bg-gray-600 hover:bg-gray-700 rounded-2xl text-white font-semibold text-lg"
                  disabled={!scanning}
                >
                  Detener Escaneo
                </button>
              </div>
            </div>

            {/* Lado derecho - cámara */}
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full h-64 md:h-80 bg-neutral-800 rounded-lg overflow-hidden flex items-center justify-center">
                {scanning ? (
                  <p className="text-gray-400">[Aquí se mostrará la cámara en vivo]</p>
                ) : (
                  <img
                    src="https://storage.googleapis.com/support-kms-prod/mQmcrC93Ryi2U4x5UdZNeyHQMybbyk71yCVm"
                    alt="Cámara desactivada"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Botones de vista */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setView('scanned')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                view === 'scanned' ? 'bg-violet-600 text-white' : 'bg-neutral-800 text-gray-300'
              }`}
            >
              Ver tickets escaneados
            </button>
            <button
              onClick={() => setView('summary')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                view === 'summary' ? 'bg-violet-600 text-white' : 'bg-neutral-800 text-gray-300'
              }`}
            >
              Ver resumen general
            </button>
          </div>

          {/* Contenido según vista */}
          <div className="max-w-5xl w-full">
            {view === 'scanned' ? (
              <>
                <h3 className="text-2xl font-bold text-violet-400 mb-6">
                  Tickets Escaneados
                </h3>
                {selectedEvent.scanned.length === 0 ? (
                  <p className="text-gray-400">Aún no se ha escaneado ningún boleto.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedEvent.scanned.map((ticket, idx) => (
                      <div
                        key={idx}
                        className="bg-black/60 backdrop-blur-md rounded-xl shadow p-5 text-white border border-violet-700"
                      >
                        <p className="text-sm text-gray-400 mb-1">
                          Código QR:
                        </p>
                        <p className="break-all font-mono text-md mb-3">{ticket.id}</p>
                        <p className="text-sm text-violet-400">Escaneado el: {ticket.date}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-black/60 p-6 rounded-xl text-white border border-violet-700">
                <h3 className="text-xl font-bold text-violet-300 mb-4">Resumen del Evento</h3>
                <p><strong>Total de boletos vendidos:</strong> {selectedEvent.totalTickets}</p>
                <p><strong>Total de asistentes escaneados:</strong> {selectedEvent.scanned.length}</p>
                <p><strong>Personas aún no ingresadas:</strong> {selectedEvent.totalTickets - selectedEvent.scanned.length}</p>
                <p className="text-sm text-gray-400 mt-4">* Estos datos se actualizan en tiempo real conforme se escanean los boletos.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Scanner;
