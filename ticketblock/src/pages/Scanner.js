import React, { useState } from 'react';

function Scanner() {
  const [scanning, setScanning] = useState(false);

  // Ejemplo de tickets escaneados por evento
  const scannedTickets = [
    {
      eventName: 'Festival de Música 2025',
      tickets: [
        { id: 'QR1234567890' },
        { id: 'QR0987654321' },
        { id: 'QR1122334455' },
      ],
    },
    {
      eventName: 'Conferencia Blockchain',
      tickets: [
        { id: 'QR6677889900' },
        { id: 'QR5566778899' },
      ],
    },
  ];

  const handleStartScan = () => {
    setScanning(true);
  };

  const handleStopScan = () => {
    setScanning(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start bg-cover bg-center px-4 py-12 mt-12"
      style={{
        backgroundImage: `url('https://i.pinimg.com/736x/87/11/2b/87112b19fc22d8cb337fac6220c6e5a7.jpg')`,
      }}
    >
      {/* Sección principal de escaneo */}
      <div className="max-w-5xl w-full bg-black/70 backdrop-blur-md rounded-2xl shadow-lg p-8 text-white flex flex-col md:flex-row gap-8 mb-12">
        {/* Columna izquierda */}
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-4 text-violet-400">
            Escáner de Tickets
          </h1>
          <p className="text-gray-300 mb-6">
            Escanea los códigos QR de los boletos para validar el acceso al evento.
            Activa tu cámara para comenzar y verifica cada acceso de forma segura.
          </p>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleStartScan}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 rounded-2xl text-white font-semibold transition text-lg"
              disabled={scanning}
            >
              Escanear Ticket QR
            </button>
            <button
              onClick={handleStopScan}
              className="w-full py-3 bg-gray-600 hover:bg-gray-700 rounded-2xl text-white font-semibold transition text-lg"
              disabled={!scanning}
            >
              Detener Escaneo
            </button>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full h-64 md:h-80 bg-neutral-800 rounded-lg overflow-hidden flex items-center justify-center">
            {scanning ? (
              <p className="text-gray-400">[Aquí se mostrará la cámara en vivo]</p>
            ) : (
              <img
                src="https://i.pinimg.com/736x/36/1f/e1/361fe1558921a943c6b9b345bb9e9bea.jpg"
                alt="Placeholder"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </div>

      {/* Sección de tickets escaneados */}
      <div className="max-w-5xl w-full">
        <h2 className="text-2xl font-bold mb-6 text-violet-400">
          Tickets Escaneados
        </h2>
        <div className="flex flex-col gap-6">
          {scannedTickets.map((event, index) => (
            <div
              key={index}
              className="bg-black/70 backdrop-blur-md rounded-xl shadow-md p-6 text-white"
            >
              <h3 className="text-xl font-semibold mb-4 text-violet-300">
                {event.eventName}
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-300">
                {event.tickets.map((ticket, idx) => (
                  <li key={idx} className="break-all">
                    Código QR: {ticket.id}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Scanner;