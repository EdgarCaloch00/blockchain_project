import React, { useState, useEffect } from 'react';

const ZONE_COLORS = {
  vip: 'border-violet-500 text-violet-500',
  generala: 'border-orange-500 text-orange-500',
  generalb: 'border-yellow-500 text-yellow-500',
};

function SeatingMap({ availableSeats, savedSeats = [], onConfirm }) {
  const [selectedSeats, setSelectedSeats] = useState(savedSeats);
  const [filterZone, setFilterZone] = useState('all');

  useEffect(() => {
    setSelectedSeats(savedSeats);
  }, [savedSeats]);

  const isSeatSelected = (seat) =>
    selectedSeats.some(
      (s) => s.zone === seat.zone && s.row === seat.row && s.column === seat.column
    );

  const isSeatAvailable = (seat) =>
    availableSeats.some(
      (s) => s.zone === seat.zone && s.row === seat.row && s.column === seat.column
    );

  const handleSeatClick = (seat) => {
    if (!isSeatAvailable(seat)) return;

    const alreadySelected = isSeatSelected(seat);
    let updatedSeats;

    if (alreadySelected) {
      updatedSeats = selectedSeats.filter(
        (s) => !(s.zone === seat.zone && s.row === seat.row && s.column === seat.column)
      );
    } else {
      if (selectedSeats.length >= 4) return;
      updatedSeats = [...selectedSeats, seat];
    }

    setSelectedSeats(updatedSeats);
    onConfirm(updatedSeats);
  };

  const zones = [...new Set(availableSeats.map((s) => s.zone))];
  const seatsToShow =
    filterZone === 'all'
      ? availableSeats
      : availableSeats.filter((s) => s.zone === filterZone);

  const maxRow = Math.max(...seatsToShow.map((s) => parseInt(s.row, 10)), 0);
  const maxCol = Math.max(...seatsToShow.map((s) => s.column), 0);

  const rows = [];
  for (let row = 1; row <= maxRow; row++) {
    const cols = [];
    for (let col = 1; col <= maxCol; col++) {
      const seat = seatsToShow.find(
        (s) => parseInt(s.row, 10) === row && s.column === col
      );

      if (seat) {
        const key = `${seat.zone}-${seat.row}-${seat.column}`;
        const available = isSeatAvailable(seat);
        const selected = isSeatSelected(seat);

        let baseClasses =
          `w-5 h-5 sm:w-10 sm:h-10 m-1 rounded-lg border flex items-center justify-center text-xs sm:text-sm font-bold cursor-pointer select-none transition-all duration-200 relative group`;
        let zoneClasses =
          ZONE_COLORS[seat.zone.toLowerCase()] || 'border-gray-500 text-gray-400';
        let bgClass = 'bg-transparent';
        
        if (!available) {
          zoneClasses = 'border-gray-600 text-gray-600 cursor-not-allowed';
        } else if (selected) {
          bgClass = 'bg-indigo-500 text-white shadow-lg';
        }

        cols.push(
          <div
            key={key}
            onClick={() => handleSeatClick(seat)}
            className={`${baseClasses} ${zoneClasses} ${bgClass} hover:scale-110 hover:shadow-xl`}
          >
            {seat.column}
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
              {seat.zone} - Fila {seat.row}, Asiento {seat.column}
            </div>
          </div>
        );
      } else {
        cols.push(
          <div
            key={`empty-${row}-${col}`}
            className="w-5 h-5 sm:w-10 sm:h-10 m-1 rounded-lg border border-gray-800 bg-transparent cursor-default"
          />
        );
      }
    }

    rows.push(
      <div key={row} className="flex flex-wrap sm:flex-nowrap items-center justify-center mb-1">
        <div className="w-5 sm:w-5 mr-2 text-right text-gray-400 select-none text-xs font-mono">{row}</div>
        <div className="flex flex-wrap justify-center">{cols}</div>
      </div>
    );
  }

  const columnCoords = [<div key="corner" className="w-5 h-5 sm:w-10 sm:h-10 m-1" />];
  for (let col = 1; col <= maxCol; col++) {
    columnCoords.push(
      <div
        key={`col-${col}`}
        className="w-5 h-5 sm:w-10 sm:h-10 m-1 text-center text-gray-400 select-none text-xs font-mono"
      >
        {col}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-6 justify-center items-start">
      {/* Seating Map */}
      <div className="flex-1 bg-neutral-950 rounded-xl  shadow-lg overflow-x-auto">
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2 text-center lg:text-left">
          Mapa de Asientos
        </h2>
        <p className="text-gray-400 text-xs sm:text-sm mb-3 text-center lg:text-left">
          Haz clic para seleccionar (máximo 4).  
          Seleccionados: <span className="text-white font-semibold">{selectedSeats.length}</span>
        </p>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap justify-center lg:justify-start mb-3">
          <button
            onClick={() => setFilterZone('all')}
            className={`px-3 py-1 sm:px-4 sm:py-2 rounded-2xl font-semibold transition-colors duration-200 ${
              filterZone === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Todo
          </button>
          {zones.map((zone) => (
            <button
              key={zone}
              onClick={() => setFilterZone(zone)}
              className={`px-3 py-1 sm:px-4 sm:py-2 rounded-2xl font-semibold transition-colors duration-200 capitalize ${
                filterZone === zone ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>

        {/* Seat Map */}
        <div className="overflow-auto border border-gray-700 rounded-2xl p-2 bg-neutral-900">
          <div className="flex justify-center flex-wrap">{columnCoords}</div>
          {rows}
        </div>
      </div>
    </div>
  );
}

export default SeatingMap;