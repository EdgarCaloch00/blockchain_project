import React, { useState } from 'react';

 function AdminPage() {
  const [verifierAddress, setVerifierAddress] = useState('');

  const handleAddVerifier = () => {
    if (!verifierAddress.trim()) {
      alert('Por favor ingresa una dirección válida.');
      return;
    }

    console.log('Agregar como verificador:', verifierAddress);

    alert(`Verificador agregado: ${verifierAddress}`);
    setVerifierAddress('');
  };
return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{
        backgroundImage: `url('https://i.pinimg.com/1200x/33/35/62/333562eb0c2f425123789ab590c0651f.jpg')`
      }}
    >
      <div className="max-w-2xl w-full bg-black/70 backdrop-blur-md rounded-2xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-4 text-violet-400">
          Panel de Administración
        </h1>
        <p className="text-gray-300 mb-6">
          Ingresa la dirección o cadena para registrar un nuevo verificador autorizado. 
          Asegúrate de verificar que la dirección sea correcta antes de agregarla.
        </p>

        <div className="mb-4">
          <label htmlFor="verifier" className="block text-sm font-semibold mb-2">
            Dirección del Verificador:
          </label>
          <input
            type="text"
            id="verifier"
            placeholder="0x..."
            value={verifierAddress}
            onChange={(e) => setVerifierAddress(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-neutral-800/80 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-gray-400"
          />
        </div>

        <button
          onClick={handleAddVerifier}
          className="w-full py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-semibold transition"
        >
          Agregar como Verificador
        </button>
      </div>
    </div>
  );
}
export default AdminPage;
