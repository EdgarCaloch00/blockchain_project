import React, { useContext, useEffect, useState } from 'react';
// import { Html5Qrcode } from 'html5-qrcode'; // 👈 Commented out
import { Web3Context } from '../pages/web3';
const TicketFactoryABI = require('../contractsABI/TicketFactory.json');
const ethers = require('ethers');

const ScannerPage = () => {
    const [eventId, setEventId] = useState('');
    const [ticketId, setTicketId] = useState('');
    const [ticketInfo, setTicketInfo] = useState(null);
    const [ticketFactoryContract, setTicketFactoryContract] = useState(null);
    const provider = useContext(Web3Context);

    // Setup contract and signer
    useEffect(() => {
        const setupContract = async () => {
            if (!provider || !window.ethereum) return;

            try {
                const signer = provider.getSigner();

                // Get wallet address
                const address = await signer.getAddress();
                console.log("Connected wallet address:", address);
                const networkId = 5777;
                const ticketFactoryContractAddress = TicketFactoryABI.networks[networkId].address;
                const ticketFactoryContractABI = TicketFactoryABI.abi;
                const ticketFactoryContract = new ethers.Contract(ticketFactoryContractAddress, ticketFactoryContractABI, provider);
                const connectedTicketFactoryContract = ticketFactoryContract.connect(signer);
                setTicketFactoryContract(connectedTicketFactoryContract);
                console.log('Contract setup complete');
            } catch (err) {
                console.error('Error setting up contract:', err);
            }
        };

        setupContract();
    }, [provider]);

    // QR scanner setup
    useEffect(() => {
        // QR scanner code commented out
    }, []);

    const fetchAndValidateTicket = async () => {
        if (!ticketFactoryContract || !eventId || !ticketId) {
            alert('Asegúrate de llenar ambos campos: Event ID y Ticket ID.');
            return;
        }

        try {
            const ticket = await ticketFactoryContract.getTicket(eventId, ticketId);

            const formatted = {
                eventId: ticket.eventId.toString(),
                ticketId: ticket.ticketId.toString(),
                ticketType: ticket.ticketType,
                price: ethers.utils.formatEther(ticket.price),
                owner: ticket.owner,
                sold: ticket.sold,
                scanned: ticket.scanned,
                row: ticket.row.toString(),
                column: ticket.column.toString(),
            };

            setTicketInfo(formatted);

            // Validación para el escaneo
            const isValid =
                ticket.sold &&
                ticket.owner !== ethers.constants.AddressZero &&
                !ticket.scanned;

            if (isValid) {
                const tx = await ticketFactoryContract.scanTicket(eventId, ticketId, {
                    gasLimit: 300000, // or higher depending on your contract
                });
                await tx.wait();

                alert('✅ Ticket valid and marked as scanned');
                setTicketInfo({ ...formatted, scanned: true });
            } else {
                alert('❌ Ticket is invalid, not sold, or already used');
            }
        } catch (error) {
            console.error('Error fetching or scanning ticket:', error);
            // If there's a nested revert error message, show that too:
            if (error.error && error.error.message) {
                alert(`Blockchain error: ${error.error.message}`);
            } else {
                alert(`Error: ${error.message || 'No se pudo obtener o escanear el ticket.'}`);
            }
        }
    };


    return (
        <div style={{ textAlign: 'center', paddingTop: '30px' }}>
            <h2>🎫 Ticket Scanner</h2>

            <div id="reader" style={{ width: '320px', margin: 'auto' }}></div>

            <div style={{ marginTop: '30px' }}>
                <input
                    type="number"
                    placeholder="Event ID"
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    style={{ marginRight: '10px', padding: '6px' }}
                />
                <input
                    type="number"
                    placeholder="Ticket ID"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    style={{ padding: '6px' }}
                />
                <br />
                <button
                    onClick={fetchAndValidateTicket}
                    style={{ marginTop: '10px', padding: '8px 20px', cursor: 'pointer' }}
                >
                    Scan Ticket
                </button>
            </div>

            {ticketInfo && (
                <div style={{ marginTop: '20px', textAlign: 'left', display: 'inline-block' }}>
                    <h4>🎟️ Ticket Info</h4>
                    <p><strong>Type:</strong> {ticketInfo.ticketType}</p>
                    <p><strong>Price:</strong> {ticketInfo.price} ETH</p>
                    <p><strong>Owner:</strong> {ticketInfo.owner}</p>
                    <p><strong>Sold:</strong> {ticketInfo.sold ? 'Yes' : 'No'}</p>
                    <p><strong>Scanned:</strong> {ticketInfo.scanned ? 'Yes' : 'No'}</p>
                    <p><strong>Row:</strong> {ticketInfo.row}</p>
                    <p><strong>Column:</strong> {ticketInfo.column}</p>
                </div>
            )}
        </div>
    );
};

export default ScannerPage;
