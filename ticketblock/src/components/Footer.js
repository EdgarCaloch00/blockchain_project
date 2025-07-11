import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import { Web3Context } from '../pages/web3';
import { FaFacebookF, FaInstagram, FaXTwitter } from 'react-icons/fa6';

function Footer() {
  return (
    <footer className="relative bg-black text-white pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap text-left lg:text-left">
          {/* Sección Contacto */}
          <div className="w-full lg:w-6/12 px-4 mb-8 lg:mb-0">
            <h4 className="text-3xl font-bold mb-2">TicketBlock</h4>
            <p className="text-gray-400 mb-2">soporte@ticketblock.com</p>
            <p className="text-gray-400 mb-4">Teléfono: 55 5657 5859</p>
            <div className="flex space-x-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                className="bg-white text-black hover:bg-violet-500 hover:text-white transition rounded-full p-2">
                <FaFacebookF size={20} />
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer"
                className="bg-white text-black hover:bg-violet-500 hover:text-white transition rounded-full p-2">
                <FaXTwitter size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="bg-white text-black hover:bg-violet-500 hover:text-white transition rounded-full p-2">
                <FaInstagram size={20} />
              </a>
            </div>
          </div>

          {/* Sección Navegación */}
          <div className="w-full lg:w-6/12 px-4 flex flex-wrap">
            <div className="w-full md:w-6/12 mb-6 md:mb-0">
              <h5 className="uppercase text-gray-400 mb-4 font-semibold">Navegación</h5>
              <ul className="space-y-2">
                <li>
                  <a href="/" className="hover:text-violet-400 transition">Inicio</a>
                </li>
                <li>
                  <a href="/about" className="hover:text-violet-400 transition">Sobre Nosotros</a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-violet-400 transition">Contacto</a>
                </li>
              </ul>
            </div>
            <div className="w-full md:w-6/12">
              <h5 className="uppercase text-gray-400 mb-4 font-semibold">Soporte</h5>
              <ul className="space-y-2">
                <li>
                  <a href="/faq" className="hover:text-violet-400 transition">Preguntas Frecuentes</a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-violet-400 transition">Aviso de Privacidad</a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-violet-400 transition">Términos y Condiciones</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Línea y derechos reservados */}
        <hr className="my-8 border-gray-700" />
        <div className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} TicketBlock · UPIITA
        </div>
      </div>
    </footer>
  );
}

export default Footer;

