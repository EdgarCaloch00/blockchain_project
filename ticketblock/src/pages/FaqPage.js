// src/pages/FaqPage.js
import React from 'react';
import '../styles/faqPage.css';

const FaqPage = () => {
  return (
    <div className="faq-page">
      <h1>Preguntas Frecuentes (FAQs)</h1>
      <div className="faq-item">
        <h2>¿Cómo puedo comprar boletos?</h2>
        <p>Puedes comprar boletos seleccionando el evento de tu interés y siguiendo las instrucciones para la compra en línea.</p>
      </div>
      <div className="faq-item">
        <h2>¿Cuáles son las formas de pago aceptadas?</h2>
        <p>Aceptamos tarjetas de crédito, débito y pagos a través de PayPal.</p>
      </div>
      <div className="faq-item">
        <h2>¿Puedo transferir mis boletos a otra persona?</h2>
        <p>Sí, puedes transferir tus boletos a otra persona utilizando la opción de transferir boleto en tu cuenta.</p>
      </div>
      <div className="faq-item">
        <h2>¿Qué hago si tengo problemas con mi compra?</h2>
        <p>Si tienes problemas con tu compra, por favor contacta a nuestro equipo de soporte a través de soporte@ticketblock.com o al teléfono 55 5657 5859.</p>
      </div>
    </div>
  );
}

export default FaqPage;
