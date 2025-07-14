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
  const { id: eventIdParam } = useParams();
  const [walletAddress, setWalletAddress] = useState('');
  const [nfts, setNfts] = useState([]);
  const [qrVisibleMap, setQrVisibleMap] = useState({});

  useEffect(() => {
    const fetchNFTs = async () => {
      console.log('fetchNFTs started');

      if (!window.ethereum) {
        alert('Install MetaMask');
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);

      const networkId = 5777;
      const contractAddress = EventTicketNFTABI.networks[networkId]?.address;

      if (!contractAddress) {
        console.error("Contract not deployed to this network:", networkId);
        return;
      }

      const nftContract = new ethers.Contract(contractAddress, EventTicketNFTABI.abi, signer);

      const userNFTs = [];
      for (let i = 1; i <= 10; i++) {
        try {
          const owner = await nftContract.ownerOf(i);
          if (owner.toLowerCase() === address.toLowerCase()) {
            const tokenURI = await nftContract.tokenURI(i);
            const metadataRes = await fetch(ipfsToHttp(tokenURI));
            const metadata = await metadataRes.json();

            const eventIdAttr = metadata.attributes?.find(attr => attr.trait_type === "eventId");

            if (eventIdAttr && eventIdAttr.value.toString() === eventIdParam.toString()) {
              userNFTs.push({ tokenId: i, ...metadata });
            }
          }
        } catch (err) {
          // skip invalid token IDs
        }
      }

      setNfts(userNFTs);
    };

    fetchNFTs();
  }, [eventIdParam]);

  const toggleQR = (tokenId) => {
    setQrVisibleMap(prev => ({
      ...prev,
      [tokenId]: !prev[tokenId]
    }));
  };

  if (nfts.length === 0) {
    return <p>No tickets found for event {eventIdParam}.</p>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Your Tickets for Event #{eventIdParam}</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {nfts.map((nft) => {
          const isVisible = qrVisibleMap[nft.tokenId];

          return (
            <div key={nft.tokenId} style={{ border: '1px solid #ccc', padding: '1rem', width: '200px' }}>
              <button onClick={() => toggleQR(nft.tokenId)} style={{ marginBottom: '0.5rem' }}>
                {isVisible ? 'Hide QR' : 'Show QR'}
              </button>

              <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                <img
                  src={ipfsToHttp(nft.image)}
                  alt={`QR for ${nft.name}`}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
                {!isVisible && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'black',
                    opacity: 0.98,
                  }} />
                )}
              </div>

              <h4>{nft.name}</h4>
              <p><strong>ID:</strong> #{nft.tokenId}</p>
              {nft.attributes?.map((attr, i) => (
                <p key={i}><strong>{attr.trait_type}:</strong> {attr.value}</p>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TicketPage;
