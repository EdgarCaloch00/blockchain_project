// src/components/Footer.js
import React from 'react';
import '../styles/footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-section">
          <h4>Contacto</h4>
          <p>Email: soporte@ticketblock.com</p>
          <p>Teléfono: 55 5657 5859</p>
        </div>
        <div className="footer-section">
          <h4>Redes Sociales</h4>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer">X</a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>
        <div className="footer-section">
          <h4>Navegación</h4>
          <a href="/">Inicio</a>
          <a href="/about">Sobre Nosotros</a>
          <a href="/contact">Contacto</a>
        </div>
       
      </div>
      <div className="footer-bottom">
        <p>UPIITA</p>
      </div>
    </footer>
  );
}

export default Footer;

