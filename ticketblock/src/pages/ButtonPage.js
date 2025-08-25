import React, { useContext, useEffect, useState } from 'react';
import '../styles/eventForm.css';
import { Web3Context } from '../pages/web3';
import QRCode from 'qrcode';
const ethers = require("ethers");
const TicketFactoryABI = require('../contractsABI/TicketFactory.json');
const EventTicketNFTABI = require('../contractsABI/EventTicketNFT.json');

function ButtonPage() {
  const { provider, signer, account } = useContext(Web3Context);

  const [walletAddress, setWalletAddress] = useState(null);
  const [ticketFactoryContract, setTicketFactoryContract] = useState(null);
  const [eventTicketNFTContract, setEventTicketNFTContract] = useState(null);

  // State for scan ticket input
  const [scanInput, setScanInput] = useState('');

  useEffect(() => {
    const initialize = async () => {
      if (!provider || !signer || !account) {
        console.warn("Web3 context not ready");
        return;
      }

      try {
        setWalletAddress(account);
        console.log("Connected wallet address:", account);

        const networkId = 1337; // or 1337 for Ganache CLI

        const ticketFactoryContractAddress = TicketFactoryABI.networks[networkId]?.address;
        const eventTicketNFTContractAddress = EventTicketNFTABI.networks[networkId]?.address;

        if (!ticketFactoryContractAddress || !eventTicketNFTContractAddress) {
          console.error("One or both contract addresses are missing for network:", networkId);
          return;
        }

        const factoryContract = new ethers.Contract(
          ticketFactoryContractAddress,
          TicketFactoryABI.abi,
          signer
        );
        setTicketFactoryContract(factoryContract);

        const nftContract = new ethers.Contract(
          eventTicketNFTContractAddress,
          EventTicketNFTABI.abi,
          signer
        );
        setEventTicketNFTContract(nftContract);
      } catch (error) {
        console.error("Error during contract initialization:", error.message);
      }
    };

    initialize();
  }, [provider, signer, account]);

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
      console.log("Payload hash:", hash);

      // Sign the payload
      const signature = await signer.signMessage(ethers.utils.arrayify(hash));
      console.log("Signature:", signature);

      //Following method not recommended for prod:
      //const signature = await provider.send("eth_sign", [signerAddress, hash]);

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
      console.log("Image URL:", Imagedata.imageUrl);

      // Construct metadata
      const metadata = {
        name: `VIP Ticket #${ticketId}`,
        description: `Ticket for Event ${eventId}, VIP seating.`,
        image: Imagedata.imageUrl, // replace with actual URI
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

  // === New scan ticket handler ===
  const handleScanSubmit = (e) => {
    e.preventDefault();

    try {
      // Parse input JSON
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

      // Recreate hash
      const hash = ethers.utils.solidityKeccak256(
        ["uint256", "uint256"],
        [event_id, ticket_id]
      );

      // Recover signer address from signature
      // Note: signMessage signs the arrayified hash, so verifyMessage expects the same
      const recoveredAddress = ethers.utils.verifyMessage(
        ethers.utils.arrayify(hash),
        signature
      );

      console.log("Recovered address:", recoveredAddress);

      if (recoveredAddress && recoveredAddress === walletAddress) {
        alert("✅ Valid ticket signature!");
      } else {
        alert("❌ Invalid ticket signature!");
      }
    } catch (err) {
      alert("Invalid JSON input or signature");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h2>Submit Ticket Metadata with QR</h2>
      <form onSubmit={handleSubmit}>
        <button type="submit">Mint NFT with QR Code</button>
      </form>

      <hr style={{ margin: "2rem 0" }} />

      <h2>Scan Ticket</h2>
      <form onSubmit={handleScanSubmit}>
        <textarea
          rows={6}
          style={{ width: "100%", fontFamily: "monospace", fontSize: "1rem" }}
          placeholder='Paste ticket JSON here: {"event_id":1,"ticket_id":0,"signature":"0x..."}'
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
        />
        <button type="submit" style={{ marginTop: "1rem" }}>
          Verify Ticket Signature
        </button>
      </form>
    </div>
  );
}

export default ButtonPage;
