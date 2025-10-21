import React from 'react';

const BillboardCard = ({ billboard }) => {
  if (!billboard.isVisible) return null;

  return (
    <div className="bg-white p-4 rounded shadow-md">
      <img src={billboard.imageUrl} alt={billboard.name} className="w-full h-48 object-cover mb-2 rounded" />
      <h2 className="text-xl font-bold mb-1">{billboard.name}</h2>
      <p className="text-gray-600 mb-2">{billboard.description}</p>
      <p className="text-gold-500 font-bold">R{billboard.price}</p>
    </div>
  );
};

export default BillboardCard;
