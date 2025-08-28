// src/components/TicketForm.js
import React, { useContext, useEffect, useState, useRef } from 'react';
import '../styles/eventForm.css';
import { Web3Context } from '../pages/web3';
import QRCode from 'qrcode';
const ethers = require("ethers");
const TicketFactoryABI = require('../contractsABI/TicketFactory.json');
const EventTicketNFTABI = require('../contractsABI/EventTicketNFT.json');
const SERVER_URL = process.env.REACT_APP_SERVER_URL;
console.log("Server URL:", SERVER_URL);

function TicketForm({ eventDetail, ticket, onSubmit }) {
  const { provider, signer, account } = useContext(Web3Context);
  const [walletAddress, setWalletAddress] = useState(null);
  const [ticketFactoryContract, setTicketFactoryContract] = useState(null);
  const [eventTicketNFTContract, setEventTicketNFTContract] = useState(null);
  const [ethRateMXN, setEthRateMXN] = useState(null); // ETH -> MXN rate
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isBought, setIsBought] = useState(ticket.sold); // ✅ Estado de compra
  const fetchedEthRate = useRef(false);

  // Fetch ETH to MXN rate once on mount via your Node.js proxy
  useEffect(() => {
    if (fetchedEthRate.current) return;
    fetchedEthRate.current = true;

    async function fetchEthRate() {
      try {
        const res = await fetch(`${SERVER_URL}/api/eth-rate`);
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

  const executePurchase = async () => {
    try {
      setLoading(true);

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

      const uploadResponse = await fetch(`${SERVER_URL}/api/upload-image`, {
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

      const metaResponse = await fetch(`${SERVER_URL}/api/metadata`, {
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
      setIsBought(true); // ✅ Marca el boleto como comprado
      alert("Ticket comprado exitosamente!");
    } catch (error) {
      console.error("Error in ticket purchase flow:", error.message);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };




  // Calculate MXN price from ETH and rate
  const priceMXN = ethRateMXN && ticket.price
    ? (parseFloat(ticket.price) * ethRateMXN).toFixed(2)
    : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  return (
    <div>
      <form className="ticket-form" onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gray-800 border border-gray-700 flex items-center justify-center rounded-md">
            <span className="text-base font-semibold text-white text-center">{ticket.row}-{ticket.column}</span>
          </div>
          <div>
            <p className="text-gray-200 font-medium">{ticket.ticketType}</p>
            <p className="text-gray-400 text-sm">
              {parseFloat(ticket.price).toFixed(5)} ETH
              {priceMXN && ` (≈ $${priceMXN} MXN)`}
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={isBought || loading}
          className={`px-4 py-2 rounded-xl font-semibold w-full transition-transform transform ${isBought
            ? "bg-green-500 text-white cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105"
            }`}
        >
          {isBought ? "Comprado" : "Comprar boleto"}
        </button>
      </form>

      {/* Modal de confirmación */}
      {showConfirm && !isBought && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-2xl shadow-lg max-w-sm w-full text-center">
            <h3 className="text-xl font-semibold text-white mb-4">Confirmar Compra</h3>
            <p className="text-gray-300 mb-6">
              ¿Deseas comprar el boleto <span className="font-medium">{ticket.ticketType}</span> por <span className="font-medium">
                {parseFloat(ticket.price).toFixed(5)} ETH{priceMXN && ` (≈ $${priceMXN} MXN)`}
              </span>?            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={async () => {
                  setShowConfirm(false);
                  await executePurchase();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-transform transform hover:scale-105"
              >
                Sí, comprar
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-transform transform hover:scale-105"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loader */}
      {loading && (
        <div className="fixed inset-0 bg-black/40 flex flex-col items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white mt-4 text-lg font-medium">Espere, comprando ticket...</p>
        </div>
      )}
    </div>
  );
}

export default TicketForm;
