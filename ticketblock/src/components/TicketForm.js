// src/components/TicketForm.js
import React, { useContext, useEffect, useState } from 'react';
import '../styles/eventForm.css';
import { Web3Context } from '../pages/web3';
const ethers = require("ethers");
const TicketFactoryABI = require('../contractsABI/TicketFactory.json');
const EventTicketNFTABI = require('../contractsABI/EventTicketNFT.json');

function TicketForm({ eventDetail, ticket, onSubmit }) {
    const provider = useContext(Web3Context);
    const [walletAddress, setWalletAddress] = useState(null);
    const [ticketFactoryContract, setTicketFactoryContract] = useState(null);
    const [eventTicketNFTContract, setEventTicketNFTContract] = useState(null);


    useEffect(() => {
        const initialize = async () => {
            if (!provider || !window.ethereum) {
                console.error("Provider not found or MetaMask not installed");
                return;
            }

            try {
                const signer = provider.getSigner();

                // Get wallet address
                const address = await signer.getAddress();
                setWalletAddress(address);
                console.log("Connected wallet address:", address);

                // Setup TicketFactory contract
                const networkId = 5777; // Adjust if needed

                const ticketFactoryContractAddress = TicketFactoryABI.networks[networkId].address;
                const ticketFactoryContractABI = TicketFactoryABI.abi;
                const ticketFactoryContract = new ethers.Contract(ticketFactoryContractAddress, ticketFactoryContractABI, provider);
                const connectedTicketFactoryContract = ticketFactoryContract.connect(signer);
                setTicketFactoryContract(connectedTicketFactoryContract);

                // Setup EventTicketNFT contract
                const eventTicketNFTContractAddress = EventTicketNFTABI.networks[networkId].address;
                const eventTicketNFTContractABI = EventTicketNFTABI.abi;
                const eventTicketNFTContract = new ethers.Contract(eventTicketNFTContractAddress, eventTicketNFTContractABI, provider);
                const connectedEventTicketNFTContract = eventTicketNFTContract.connect(signer);
                setEventTicketNFTContract(connectedEventTicketNFTContract);

            } catch (error) {
                console.error("Error during initialization:", error.message);
            }
        };

        initialize();
    }, [provider]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        const metadata = {
            name: eventDetail.title,
            description: eventDetail.description,
            image: "ipfs://bafybeicumcizjwmykcdouhyrrkm7pil3hfpwi3carrplg4rltyegdz3ri4/BulbasaurPhoto.png", // replace with actual URI
            attributes: [
                { trait_type: "Event ID", value: eventDetail.eventId },
                { trait_type: "Ticket ID", value: ticket.ticketId },
                { trait_type: "Ticket Type", value: ticket.ticketType },
                { trait_type: "Row", value: ticket.row },
                { trait_type: "Column", value: ticket.column }
            ]
        };
        onSubmit(metadata);

        try {
            // Send metadata to server
            const response = await fetch('http://localhost:5000/api/metadata', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metadata)
            });

            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}`);
            }

            const data = await response.json();
            const metadataUrl = data.metadataUrl;
            console.log("Server response:", metadataUrl);


            if (!eventTicketNFTContract) {
                throw new Error("NFT contract not connected");
            }

            // Call your mint function on the smart contract
            // Assumes mintTicket(address to, string tokenURI)
            const signerAddress = await eventTicketNFTContract.signer.getAddress();
            console.log(signerAddress);
            const tx = await eventTicketNFTContract.mintTicket(signerAddress, metadataUrl);
            console.log("Mint transaction sent:", tx.hash);

            // Wait for confirmation
            await tx.wait();
            console.log("Mint transaction confirmed!");

            // Buy ticket using correct ticket and event IDs
            const eventId = eventDetail.eventId;
            const ticketId = ticket.ticketId;

            // Convert ticket price to BigNumber (assuming ticket.price is in Wei)
            const price = ethers.utils.parseEther(ticket.price.toString()); // converts "0.01" ETH to BigNumber in wei

            const buyTx = await ticketFactoryContract.buyTicket(
                eventId,
                ticketId,
                {
                    value: price // send the correct price
                }
            );

            await buyTx.wait();
            console.log("Ticket successfully bought!");

        } catch (error) {
            console.error("Error during ticket purchase:", error.message);
        }
    };

    return (
        <form className="ticket-form" onSubmit={handleSubmit}>
            <h3>Reservar Boleto</h3>
            <input type="hidden" name="title" value={eventDetail.title} />
            <input type="hidden" name="description" value={eventDetail.description} />
            <input type="hidden" name="eventId" value={eventDetail.eventId} />
            <input type="hidden" name="ticketId" value={ticket.ticketId} />
            <div>
                <label>Tipo de Boleto: </label>
                <a>{ticket.ticketType}</a>
                <input type="hidden" name="ticketType" value={ticket.ticketType} />
            </div>
            <div>
                <label>Fila: </label>
                <a>{ticket.row}</a>
                <input type="hidden" name="row" value={ticket.row} />
            </div>
            <div>
                <label>Asiento: </label>
                <a>{ticket.column}</a>
                <input type="hidden" name="column" value={ticket.column} />
            </div>
            <button type="submit">Comprar boleto</button>
        </form>
    );
}

export default TicketForm;
