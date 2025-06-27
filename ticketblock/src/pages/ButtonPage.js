import React, { useContext, useEffect, useState } from 'react';
import '../styles/eventForm.css';
import { Web3Context } from '../pages/web3';
import QRCode from 'qrcode';
const ethers = require("ethers");
const TicketFactoryABI = require('../contractsABI/TicketFactory.json');
const EventTicketNFTABI = require('../contractsABI/EventTicketNFT.json');

function ButtonPage() {
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
                const address = await signer.getAddress();
                setWalletAddress(address);
                console.log("Connected wallet address:", address);

                const networkId = 5777; // Ganache or your testnet ID

                const ticketFactoryContractAddress = TicketFactoryABI.networks[networkId].address;
                const ticketFactoryContractABI = TicketFactoryABI.abi;
                const factoryContract = new ethers.Contract(ticketFactoryContractAddress, ticketFactoryContractABI, provider);
                setTicketFactoryContract(factoryContract.connect(signer));

                const eventTicketNFTContractAddress = EventTicketNFTABI.networks[networkId].address;
                const eventTicketNFTContractABI = EventTicketNFTABI.abi;
                const nftContract = new ethers.Contract(eventTicketNFTContractAddress, eventTicketNFTContractABI, provider);
                setEventTicketNFTContract(nftContract.connect(signer));
            } catch (error) {
                console.error("Error during initialization:", error.message);
            }
        };

        initialize();
    }, [provider]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            if (!provider) throw new Error("Provider not available");

            const signer = provider.getSigner();
            const signerAddress = await signer.getAddress();

            // Ticket info
            const eventId = 1;
            const ticketId = 0;

            // Hash payload
            const hash = ethers.utils.solidityKeccak256(
                ["uint256", "uint256"],
                [eventId, ticketId]
            );

            // Sign the payload
            //const signature = await signer.signMessage(ethers.utils.arrayify(hash));
            //Following method not recommended for prod:
            const signature = await provider.send("eth_sign", [signerAddress, hash]);

            // Create payload
            const payload = {
                event_id: eventId,
                ticket_id: ticketId,
                signature: signature
            };

            const payloadString = JSON.stringify(payload);

            // Generate QR Code as image (base64 data URI)
            const qrDataUrl = await QRCode.toDataURL(payloadString);

            const ImageResponse = await fetch('http://localhost:5000/api/upload-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageBase64: qrDataUrl  // the base64 string from QRCode.toDataURL(...)
                })
            });

            const Imagedata = await ImageResponse.json();
            console.log(Imagedata.imageUrl); // this will be your IPFS-hosted image

            // Construct metadata
            const metadata = {
                name: `VIP Ticket #${ticketId}`,
                description: `Ticket for Event ${eventId}, VIP seating.`,
                image: Imagedata.imageUrl, // QR image instead of hardcoded IPFS link
                attributes: [
                    { trait_type: "Event ID", value: eventId },
                    { trait_type: "Ticket ID", value: ticketId },
                    { trait_type: "Ticket Type", value: "typeVIP" },
                    { trait_type: "Row", value: 5 },
                    { trait_type: "Column", value: 8 }
                ]
            };

            // Upload metadata to backend
            const response = await fetch('http://localhost:5000/api/metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metadata)
            });

            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}`);
            }

            const data = await response.json();
            const metadataUrl = data.metadataUrl;
            console.log("Metadata IPFS URL:", metadataUrl);

            if (!eventTicketNFTContract) {
                throw new Error("NFT contract not connected");
            }

            // Call mintTicket
            const tx = await eventTicketNFTContract.mintTicket(signerAddress, metadataUrl);
            console.log("Mint transaction sent:", tx.hash);
            await tx.wait();
            console.log("Mint transaction confirmed!");

        } catch (error) {
            console.error("Error during ticket minting:", error.message);
        }
    };

    return (
        <div style={{ padding: "2rem", fontFamily: "Arial" }}>
            <h2>Submit Ticket Metadata with QR</h2>
            <form onSubmit={handleSubmit}>
                <button type="submit">Mint NFT with QR Code</button>
            </form>
        </div>
    );
}

export default ButtonPage;
