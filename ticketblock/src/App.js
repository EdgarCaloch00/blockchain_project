// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ButtonPage from './pages/ButtonPage';
import ScannerPage from './pages/ScannerPage';
import Scanner from './pages/Scanner';
import ViewNFTPage from './pages/ViewNFTPage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import MyEventsPage from './pages/MyEventsPage';
import TicketPage from './pages/TicketPage';
import RegisterEventPage from './pages/RegisterEventPage';
import AboutPage from './pages/AboutPage';
import FaqPage from './pages/FaqPage';
import Header from './components/Header';
import Footer from './components/Footer';
import { Web3Provider } from './pages/web3'; // Import Web3Provider from the src folder


function App() {
  return (
    <Router>
      <Web3Provider> {/* Wrap entire routing setup with Web3Provider */}
        <div className="app">
          <Header />
          <div className="main">
            <Routes>
              <Route exact path="/" element={<HomePage />} />
              <Route path="/button" element={<ButtonPage />} />
              <Route path="/scanner" element={<ScannerPage />} />
              <Route path="/scannerfront" element={<Scanner />} />
              <Route path="/view" element={<ViewNFTPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:category" element={<EventsPage />} />
              <Route path="/event/:id" element={<EventDetailsPage />} />
              <Route path="/myevents" element={<MyEventsPage />} />
              <Route path="/ticket/:id" element={<TicketPage />} />
              <Route path="/register-event" element={<RegisterEventPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FaqPage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Web3Provider>
    </Router>
  );
}

export default App;

