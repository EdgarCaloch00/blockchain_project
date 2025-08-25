// src/components/TicketForm.js
import React, { useContext, useEffect, useState, useRef } from 'react';
import '../styles/eventForm.css';
import { Web3Context } from '../pages/web3';
import QRCode from 'qrcode';
const ethers = require("ethers");
const TicketFactoryABI = require('../contractsABI/TicketFactory.json');
const EventTicketNFTABI = require('../contractsABI/EventTicketNFT.json');

function TicketForm({ eventDetail, ticket, onSubmit }) {
  const { provider, signer, account } = useContext(Web3Context);
  const [walletAddress, setWalletAddress] = useState(null);
  const [ticketFactoryContract, setTicketFactoryContract] = useState(null);
  const [eventTicketNFTContract, setEventTicketNFTContract] = useState(null);
  const [ethRateMXN, setEthRateMXN] = useState(null); // ETH -> MXN rate

  // Ref to ensure ETH rate fetch only once per mount/session
  const fetchedEthRate = useRef(false);

  // Fetch ETH to MXN rate once on mount via your Node.js proxy
  useEffect(() => {
    if (fetchedEthRate.current) return;
    fetchedEthRate.current = true;

    async function fetchEthRate() {
      try {
        const res = await fetch('http://localhost:5000/api/eth-rate');
        if (!res.ok) throw new Error(`Failed to fetch ETH rate: ${res.status}`);
        const data = await res.json();
        setEthRateMXN(data.ethereum.mxn);
      } catch (err) {
        console.error("Failed to fetch ETH rate:", err);
      }
    }
    fetchEthRate();
  }, []);

  useEffect(() => {
    const initialize = async () => {
      if (!provider || !signer || !account || !window.ethereum) {
        console.error("Provider, signer, or account not ready or MetaMask not installed");
        return;
      }

      try {
        setWalletAddress(account);
        console.log("Connected wallet address:", account);

        const networkId = 1337; // Adjust if needed

        const ticketFactoryContractAddress = TicketFactoryABI.networks[networkId]?.address;
        if (!ticketFactoryContractAddress) throw new Error("TicketFactory contract address not found");

        const ticketFactoryContractABI = TicketFactoryABI.abi;
        const ticketFactoryContractInstance = new ethers.Contract(ticketFactoryContractAddress, ticketFactoryContractABI, signer);
        setTicketFactoryContract(ticketFactoryContractInstance);

        const eventTicketNFTContractAddress = EventTicketNFTABI.networks[networkId]?.address;
        if (!eventTicketNFTContractAddress) throw new Error("EventTicketNFT contract address not found");

        const eventTicketNFTContractABI = EventTicketNFTABI.abi;
        const eventTicketNFTContractInstance = new ethers.Contract(eventTicketNFTContractAddress, eventTicketNFTContractABI, signer);
        setEventTicketNFTContract(eventTicketNFTContractInstance);

      } catch (error) {
        console.error("Error during initialization:", error.message);
      }
    };

    initialize();
  }, [provider, signer, account]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!signer) throw new Error("Signer is not available");
      if (!ticketFactoryContract) throw new Error("TicketFactory contract not initialized");

      const eventId = eventDetail.eventId;
      const ticketId = ticket.ticketId; // canonical ticketId

      // 1️⃣ Generate QR code and upload as before
      const hash = ethers.utils.solidityKeccak256(
        ["uint256", "uint256"],
        [eventId, ticketId]
      );

      const signature = await signer.signMessage(ethers.utils.arrayify(hash));

      const payload = {
        event_id: eventId,
        ticket_id: ticketId,
        signature: signature
      };

      const qrDataUrl = await QRCode.toDataURL(JSON.stringify(payload));

      const uploadResponse = await fetch('http://localhost:5000/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: qrDataUrl })
      });
      const uploadData = await uploadResponse.json();
      const qrImageUrl = uploadData.imageUrl;
      console.log("QR code image URL:", qrImageUrl);

      const metadata = {
        name: eventDetail.title,
        description: eventDetail.description,
        image: qrImageUrl,
        attributes: [
          { trait_type: "eventId", value: eventId },
          { trait_type: "ticketId", value: ticketId },
          { trait_type: "ticketType", value: ticket.ticketType },
          { trait_type: "row", value: ticket.row },
          { trait_type: "column", value: ticket.column }
        ]
      };

      const metaResponse = await fetch('http://localhost:5000/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata)
      });
      const metaData = await metaResponse.json();
      const metadataUrl = metaData.metadataUrl;
      console.log("Metadata URL:", metadataUrl);

      // 2️⃣ Mint NFT and get tokenId
      const signerAddress = await eventTicketNFTContract.signer.getAddress();
      const mintTx = await eventTicketNFTContract.mintTicket(signerAddress, metadataUrl);
      const receipt = await mintTx.wait();
      const mintedTokenId = receipt.events[0].args.tokenId.toNumber();
      console.log("Minted NFT tokenId:", mintedTokenId);

      // 3️⃣ Buy ticket using canonical ticketId
      let priceInWei;
      if (typeof ticket.price === "string") {
        priceInWei = ethers.utils.parseEther(ticket.price); // ETH string → BigNumber wei
      } else {
        priceInWei = ticket.price; // already BigNumber in wei
      }
      console.log("Price in wei for purchase:", priceInWei.toString());

      const buyTx = await ticketFactoryContract.buyTicket(eventId, ticketId, { value: priceInWei });
      await buyTx.wait();

      // 4️⃣ Link NFT tokenId to ticketId in the contract
      const linkTx = await ticketFactoryContract.setTicketTokenId(eventId, ticketId, mintedTokenId);
      await linkTx.wait();

      console.log("Ticket successfully bought and NFT linked!");
    } catch (error) {
      console.error("Error in ticket purchase flow:", error.message);
    }
  };




  // Calculate MXN price from ETH and rate
  const priceMXN = ethRateMXN && ticket.price
    ? (parseFloat(ticket.price) * ethRateMXN).toFixed(2)
    : null;

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

      <div>
        <label>Precio: </label>
        <span>
          {ticket.price} ETH
          {priceMXN && ` (≈ $${priceMXN} MXN)`}
        </span>
        <input type="hidden" name="price" value={ticket.price} />
      </div>

      <button type="submit">Comprar boleto</button>
    </form>
  );
}

export default TicketForm;
