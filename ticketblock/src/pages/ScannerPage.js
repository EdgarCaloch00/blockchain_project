import React, { useContext, useEffect, useState } from 'react';
import { Web3Context } from '../pages/web3';
const TicketFactoryABI = require('../contractsABI/TicketFactory.json');
const ethers = require('ethers');

const ScannerPage = () => {
    const { provider, signer, account } = useContext(Web3Context);

    const [scanInput, setScanInput] = useState('');
    const [ticketInfo, setTicketInfo] = useState(null);
    const [ticketFactoryContract, setTicketFactoryContract] = useState(null);
    const [scannedTickets, setScannedTickets] = useState({}); // local scanned tickets

    useEffect(() => {
        const setupContract = async () => {
            if (!provider || !signer || !account) {
                console.warn("Web3 context not ready");
                return;
            }

            try {
                const networkId = 1337;
                const ticketFactoryContractAddress = TicketFactoryABI.networks[networkId]?.address;

                if (!ticketFactoryContractAddress) {
                    console.error(`TicketFactory contract not deployed on network ${networkId}`);
                    return;
                }

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

    const handleScanSubmit = async (e) => {
        e.preventDefault();

        try {
            // Parse JSON input
            const payload = JSON.parse(scanInput);
            const { event_id, ticket_id, signature } = payload;

            if (
                typeof event_id !== "number" ||
                typeof ticket_id !== "number" ||
                typeof signature !== "string"
            ) {
                alert("Invalid input JSON structure");
                return;
            }

            if (!ticketFactoryContract) {
                alert("Contract not loaded yet. Try again shortly.");
                return;
            }

            // Fetch ticket info from contract
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

            // Validate if ticket was sold and not scanned yet
            const isValid =
                ticket.sold && !ticket.scanned;

            if (!isValid) {
                alert('❌ Ticket is invalid, not sold, or already scanned');
                return;
            }

            // Verify signature
            const hash = ethers.utils.solidityKeccak256(
                ["uint256", "uint256"],
                [event_id, ticket_id]
            );

            const recoveredAddress = ethers.utils.verifyMessage(
                ethers.utils.arrayify(hash),
                signature
            );

            // Mark ticket as scanned on-chain
            const tx = await ticketFactoryContract.scanTicket(event_id, ticket_id, {
                gasLimit: 300000,
            });
            await tx.wait();

            alert('✅ Ticket valid and marked as scanned on-chain.');

            // Update local scanned state
            setTicketInfo(prev => ({ ...prev, scanned: true }));

        } catch (err) {
            alert("Error validating ticket or scanning it");
            console.error(err);
        }
    };




    return (
        <div style={{ textAlign: 'center', paddingTop: '30px' }}>
            <h2>🎫 Ticket Scanner</h2>

            <form onSubmit={handleScanSubmit}>
                <textarea
                    rows={6}
                    style={{ width: "100%", fontFamily: "monospace", fontSize: "1rem" }}
                    placeholder='Paste ticket JSON here: {"event_id":1,"ticket_id":0,"signature":"0x..."}'
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                />
                <button
                    type="submit"
                    style={{ marginTop: "1rem", padding: '8px 20px', cursor: 'pointer' }}
                >
                    Verify & Scan Ticket
                </button>
            </form>

            {ticketInfo && (
                <div style={{ marginTop: '20px', textAlign: 'left', display: 'inline-block' }}>
                    <h4>🎟️ Ticket Info</h4>
                    <p><strong>Event ID:</strong> {ticketInfo.eventId}</p>
                    <p><strong>Ticket ID:</strong> {ticketInfo.ticketId}</p>
                    <p><strong>Type:</strong> {ticketInfo.ticketType}</p>
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
