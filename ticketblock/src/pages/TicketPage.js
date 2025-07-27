import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
const ethers = require("ethers");
const EventTicketNFTABI = require('../contractsABI/EventTicketNFT.json');

const ipfsToHttp = (ipfsUrl) => {
  return ipfsUrl.startsWith("ipfs://")
    ? ipfsUrl.replace("ipfs://", "https://dweb.link/ipfs/")
    : ipfsUrl;
};

const getAttr = (nft, key) => {
  const attr = nft.attributes?.find(attr => attr.trait_type === key);
  return attr?.value || "N/A";
};

const TicketPage = () => {
  const { id: eventIdParam } = useParams();
  const [walletAddress, setWalletAddress] = useState('');
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrVisibleMap, setQrVisibleMap] = useState({});

  useEffect(() => {
    const fetchNFTs = async () => {
      setLoading(true);
      if (!window.ethereum) {
        alert('Instala MetaMask');
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
        console.error("Contrato no desplegado en esta red:", networkId);
        setLoading(false);
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
          // token no válido o no existe
        }
      }

      setNfts(userNFTs);
      setLoading(false);
    };

    fetchNFTs();
  }, [eventIdParam]);

  const toggleQR = (tokenId) => {
    setQrVisibleMap(prev => ({
      ...prev,
      [tokenId]: !prev[tokenId]
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white bg-neutral-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-500 mb-4"></div>
        <p className="text-lg text-zinc-300">Cargando tu boleto</p>
      </div>
    );
  }

  if (nfts.length === 0) {
    return <p className="text-white text-center mt-10">No se encontraron boletos para el evento #{eventIdParam}.</p>;
  }

  return (
    <div className="pt-20 pb-6 px-6 mx-auto lg:px-16 bg-neutral-950">
      <button
      onClick={() => window.history.back()}
      className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-black text-white hover:bg-zinc-950 transition z-50 shadow-md"
    >
      Regresar
    </button>
      <h1 className="text-3xl py-3 font-semibold text-white text-start">Tu entrada</h1>
      {nfts.map((nft) => {
        const isVisible = qrVisibleMap[nft.tokenId];

        return (
          <div
            key={nft.tokenId}
            className="mb-6 lg:w-1/3 lg:mx-auto bg-gradient-to-br from-zinc-800 to-zinc-900 text-white rounded-2xl shadow-2xl p-6 flex flex-col justify-between border border-zinc-700"
          >
            <h3 className="text-2xl font-bold text-center mb-2">{nft.name}</h3>
            <p className="text-center text-sm text-zinc-300 mb-4">{nft.description}</p>

            <div className="text-sm text-zinc-300 space-y-1 mb-4">
              <p><span className="font-medium text-gray-400">Fecha:</span> {getAttr(nft, 'date')}</p>
              <p><span className="font-medium text-gray-400">Lugar:</span> {getAttr(nft, 'venue')}</p>
            </div>

            <div className="bg-zinc-700/50 p-4 rounded-xl flex justify-between items-center text-sm text-zinc-200 mb-5 shadow-inner">
              <div className="flex-1 text-center">
                <p className="text-zinc-400">Zona</p>
                <p className="font-semibold">{getAttr(nft, 'ticketType')}</p>
              </div>
              <div className="flex-1 text-center border-l border-r border-zinc-600">
                <p className="text-zinc-400">Fila</p>
                <p className="font-semibold">{getAttr(nft, 'row')}</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-zinc-400">Asiento</p>
                <p className="font-semibold">{getAttr(nft, 'column')}</p>
              </div>
            </div>

            <div className="text-center text-base font-semibold mb-4 text-indigo-400">
              ID del boleto: #{nft.tokenId}
            </div>

            <div className="relative w-full mb-4">
              <img
                src={ipfsToHttp(nft.image)}
                alt={`QR de ${nft.name}`}
                className={`w-full rounded-lg shadow-lg transition duration-300 ${
                  !isVisible ? 'blur-sm brightness-50' : ''
                }`}
              />
            </div>

            <button
              onClick={() => toggleQR(nft.tokenId)}
              className="mt-auto bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-5 py-2 rounded-2xl transition"
            >
              {isVisible ? 'Ocultar QR' : 'Mostrar QR'}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default TicketPage;
