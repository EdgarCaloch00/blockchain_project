// src/components/SeatingMap.js
import React, { useState, useEffect } from 'react';
import '../styles/seatingMap.css';

function SeatingMap({ availableSeats, totalSeats, onClose, onConfirm, savedSeats }) {
  const [selectedSeats, setSelectedSeats] = useState(savedSeats || []);
  
  useEffect(() => {
    setSelectedSeats(savedSeats || []);
  }, [savedSeats]);

  const rows = Math.ceil(totalSeats / 10);
  const vipRows = 5;
  const generalRows = rows - vipRows;
  const generalARows = Math.ceil(generalRows / 2);
  const generalBRows = Math.floor(generalRows / 2);
  const seats = [];
  let seatCounter = 0;

  const handleSeatClick = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(seat => seat !== seatId));
    } else {
      if (selectedSeats.length < 4) {
        setSelectedSeats([...selectedSeats, seatId]);
      }
    }
  };

  const handleConfirmClick = () => {
    onConfirm(selectedSeats);
    onClose();
  };

  for (let i = 1; i <= rows; i++) {
    const rowSeats = [];
    for (let j = 1; j <= 10; j++) {
      if (seatCounter < totalSeats) {
        seatCounter++;
        const seatId = `${i}-${j}`;
        const isAvailable = availableSeats.includes(seatId);
        const isSelected = selectedSeats.includes(seatId);
        const seatClass = isAvailable ? (isSelected ? 'seat selected' : 'seat available') : 'seat unavailable';
        rowSeats.push(
          <div
            key={seatId}
            className={seatClass}
            onClick={isAvailable ? () => handleSeatClick(seatId) : null}
          >
            <span>{seatId}</span>
          </div>
        );
      }
    }
    seats.push(<div key={`row-${i}`} className="row">{rowSeats}</div>);
  }

  return (
    <div className="seating-map-overlay">
      <div className="seating-map">
        <button onClick={onClose} className="close-button">X</button>
        <div className="stage">Escenario</div>
        <div className="seats-container">
          <div className="seats">
            {seats.slice(0, vipRows).map(row => row)}
            <div className="divider">Zona VIP</div>
            {seats.slice(vipRows, vipRows + generalARows).map(row => row)}
            <div className="divider">General A</div>
            {seats.slice(vipRows + generalARows).map(row => row)}
            <div className="divider">General B</div>
          </div>
        </div>
        <div className="selection-info">
          <p>Asientos seleccionados: {selectedSeats.join(', ')}</p>
          {selectedSeats.length === 4 && <p style={{ color: 'red' }}>Máximo 4 asientos seleccionados</p>}
        </div>
        <button 
          className="confirm-button" 
          onClick={handleConfirmClick} 
          disabled={selectedSeats.length === 0}
        >
          Confirmar Asientos
        </button>
        <div className="scroll-message">Desliza para ver todos los asientos</div>
      </div>
    </div>
  );
}

export default SeatingMap;
