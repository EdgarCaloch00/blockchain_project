import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
const ethers = require("ethers");
const EventTicketNFTABI = require('../contractsABI/EventTicketNFT.json');

const ipfsToHttp = (ipfsUrl) => {
  if (ipfsUrl.startsWith("ipfs://")) {
    return ipfsUrl.replace("ipfs://", "https://dweb.link/ipfs/");
  }
  return ipfsUrl;
};

const TicketPage = () => {
  const { id: eventIdParam } = useParams(); // read event ID from URL
  const [walletAddress, setWalletAddress] = useState('');
  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    const fetchNFTs = async () => {
      console.log('fetchNFTs started');  // <== check this appears on page load

      if (!window.ethereum) {
        alert('Install MetaMask');
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);

      const networkId = 5777; // Adjust if needed

      const eventTicketNFTContractAddress = EventTicketNFTABI.networks[networkId]?.address;
      if (!eventTicketNFTContractAddress) {
        console.error("Contract not deployed to this network:", networkId);
        return;
      }

      const nftContract = new ethers.Contract(eventTicketNFTContractAddress, EventTicketNFTABI.abi, signer);

      const userNFTs = [];
      for (let i = 1; i <= 10; i++) {
        try {
          const owner = await nftContract.ownerOf(i);
          if (owner.toLowerCase() === address.toLowerCase()) {
            const tokenURI = await nftContract.tokenURI(i);
            const metadataRes = await fetch(ipfsToHttp(tokenURI));
            const metadata = await metadataRes.json();

            const eventIdAttr = metadata.attributes?.find(attr => attr.trait_type === "eventId");

            console.log(`TokenID ${i} attributes:`, metadata.attributes);
            console.log(`TokenID ${i} eventIdAttr:`, eventIdAttr);
            console.log(`Filtering for eventIdParam: ${eventIdParam}`);

            if (eventIdAttr && eventIdAttr.value.toString() === eventIdParam.toString()) {
              userNFTs.push({ tokenId: i, ...metadata });
            }
          }
        } catch (err) {
          // tokenId may not exist, skip
        }
      }

      setNfts(userNFTs);
    };

    fetchNFTs();
  }, [eventIdParam]);

  if (nfts.length === 0) {
    return <p>No tickets found for event {eventIdParam}.</p>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Your Tickets for Event #{eventIdParam}</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {nfts.map((nft) => (
          <div key={nft.tokenId} style={{ border: '1px solid #ccc', padding: '1rem', width: '200px' }}>
            <img
              src={ipfsToHttp(nft.image)}
              alt={nft.name}
              style={{ width: '100%', height: 'auto', marginBottom: '0.5rem' }}
            />
            <h4>{nft.name}</h4>
            <p><strong>ID:</strong> #{nft.tokenId}</p>
            {nft.attributes?.map((attr, i) => (
              <p key={i}><strong>{attr.trait_type}:</strong> {attr.value}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicketPage;
