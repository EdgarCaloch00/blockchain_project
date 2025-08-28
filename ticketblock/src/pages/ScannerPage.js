import React, { useContext, useEffect, useState, useRef } from 'react';
import { Web3Context } from '../pages/web3';
import { Html5Qrcode } from "html5-qrcode";
const TicketFactoryABI = require('../contractsABI/TicketFactory.json');
const ethers = require('ethers');

const ScannerPage = () => {
  const { provider, signer, account } = useContext(Web3Context);

  const [ticketInfo, setTicketInfo] = useState(null);
  const [ticketFactoryContract, setTicketFactoryContract] = useState(null);
  const [qrError, setQrError] = useState(null);
  const [scanning, setScanning] = useState(false);

  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Setup contract
  useEffect(() => {
    const setupContract = async () => {
      if (!provider || !signer || !account) return;
      try {
        const networkId = 1337;
        const ticketFactoryContractAddress = TicketFactoryABI.networks[networkId]?.address;
        if (!ticketFactoryContractAddress) return;

        const contract = new ethers.Contract(
          ticketFactoryContractAddress,
          TicketFactoryABI.abi,
          signer
        );
        setTicketFactoryContract(contract);
      } catch (err) {
        console.error('Error setting up contract:', err);
      }
    };

    setupContract();
  }, [provider, signer, account]);

  // Start scanner
  const startScanner = async () => {
    if (!qrRef.current || scanning) return;

    const config = { fps: 10, qrbox: { width: 400, height: 300 } }; // wider than tall

    // Only initialize once
    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode(qrRef.current.id);
    }

    const onScanSuccess = async (decodedText) => {
      try {
        const payload = JSON.parse(decodedText);

        if (html5QrCodeRef.current) {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
          setScanning(false);
        }

        await handleScanSubmit(payload);
      } catch (err) {
        console.error("❌ Invalid QR: not valid JSON", err);
        setQrError("Invalid QR: not valid JSON");
      }
    };

    const onScanFailure = (errorMessage) => {
      // ignore for now
    };

    try {
      // First try exact rear camera
      await html5QrCodeRef.current.start(
        { facingMode: { exact: "environment" } },
        config,
        onScanSuccess,
        onScanFailure
      ).catch(async () => {
        // Fallback to default environment
        await html5QrCodeRef.current.start(
          { facingMode: "environment" },
          config,
          onScanSuccess,
          onScanFailure
        );
      });

      setScanning(true);
      setQrError(null);
    } catch (err) {
      console.error("QR start error:", err);
      setQrError("Failed to start QR scanner. Check camera permissions.");
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        setScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const handleScanSubmit = async (payload) => {
    try {
      const { event_id, ticket_id, signature } = payload;

      if (
        typeof event_id !== "number" ||
        typeof ticket_id !== "number" ||
        typeof signature !== "string"
      ) {
        alert("Invalid ticket format");
        return;
      }

      if (!ticketFactoryContract) {
        alert("Contract not loaded yet.");
        return;
      }

      const ticket = await ticketFactoryContract.getTicketById(event_id, ticket_id);

      const formatted = {
        eventId: ticket.eventId.toString(),
        ticketId: ticket.ticketId.toString(),
        ticketType: ticket.ticketType,
        price: ethers.utils.formatEther(ticket.price),
        sold: ticket.sold,
        scanned: ticket.scanned,
        row: ticket.row.toString(),
        column: ticket.column.toString(),
      };
      setTicketInfo(formatted);

      if (!(ticket.sold && !ticket.scanned)) {
        alert("❌ Ticket invalid or already scanned");
        return;
      }

      const hash = ethers.utils.solidityKeccak256(
        ["uint256", "uint256"],
        [event_id, ticket_id]
      );
      const recoveredAddress = ethers.utils.verifyMessage(
        ethers.utils.arrayify(hash),
        signature
      );

      const tx = await ticketFactoryContract.scanTicket(event_id, ticket_id, { gasLimit: 300000 });
      await tx.wait();

      alert("✅ Ticket valid and marked as scanned");
      setTicketInfo(prev => ({ ...prev, scanned: true }));

    } catch (err) {
      console.error(err);
      alert("Error validating ticket");
    }
  };

  return (
    <div
      className="py-16 px-4 flex justify-center items-start min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1618601208185-f6ff920d961c?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
      }}
    >
      <div className="w-full max-w-6xl bg-black/70 backdrop-blur-lg rounded-2xl shadow-lg p-8 space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white mb-2">Escaneo de Tickets</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Escanea los boletos en la entrada y valida a los asistentes en tiempo real.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Info + Controls */}
          <div className="space-y-6 text-white">
            <div className="space-y-4 bg-neutral-900 p-6 rounded-2xl">
              <p><span className="text-violet-400 font-semibold">Event ID:</span> {ticketInfo?.eventId || '-'}</p>
              <p><span className="text-green-400 font-semibold">Ticket ID:</span> {ticketInfo?.ticketId || '-'}</p>
              <p><span className="text-yellow-400 font-semibold">Tipo:</span> {ticketInfo?.ticketType || '-'}</p>
              <p><span className="text-red-400 font-semibold">Escaneado:</span> {ticketInfo ? (ticketInfo.scanned ? 'Sí' : 'No') : '-'}</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={startScanner}
                className="py-4 bg-violet-600 hover:bg-violet-700 rounded-2xl text-white font-bold text-lg transition duration-300"
                disabled={scanning}
              >
                Escanear Ticket QR
              </button>
              <button
                onClick={stopScanner}
                className="py-4 bg-gray-600 hover:bg-gray-700 rounded-2xl text-white font-bold text-lg transition duration-300"
                disabled={!scanning}
              >
                Detener Escaneo
              </button>
            </div>
          </div>

          {/* Right Column: QR Scanner */}
          <div className="flex items-center justify-center">
            <div className="w-full h-64 md:h-80 bg-neutral-800 rounded-2xl overflow-hidden flex items-center justify-center relative">
              <div ref={qrRef} id="qr-reader" className="w-full h-full" />
              {!scanning && (
                <div className="absolute w-full h-full flex items-center justify-center text-gray-400">
                  Cámara desactivada
                </div>
              )}
            </div>
          </div>
        </div>

        {qrError && <p className="text-red-500 mt-4 text-center">{qrError}</p>}
      </div>
    </div>
  );
};

export default ScannerPage;
