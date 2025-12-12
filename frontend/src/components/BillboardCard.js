import React from 'react';

const BillboardCard = ({ billboard, onClick }) => {
  const mainImage = billboard.images?.[0] || billboard.imagePath || '/placeholder.jpg';
  const imageCount = billboard.images?.length || 0;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer border border-gray-200"
    >
      <div className="relative h-56 bg-gray-100 overflow-hidden">
        <img 
          src={mainImage}
          alt={billboard.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = '/placeholder.jpg';
          }}
        />
        {imageCount > 1 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            {imageCount} photos
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-xl font-bold text-blue-900 mb-2">{billboard.name}</h3>
        
        {billboard.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{billboard.description}</p>
        )}

        {billboard.location?.address && (
          <div className="flex items-start text-gray-600 text-sm mb-3">
            <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-2">{billboard.location.address}</span>
          </div>
        )}

        {billboard.price && (
          <div className="text-blue-900 font-bold text-lg mb-3">
            R{billboard.price.toLocaleString()}<span className="text-sm text-gray-600">/month</span>
          </div>
        )}

        <button className="w-full px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition font-medium text-sm">
          View Details
        </button>
      </div>
    </div>
  );
};

export default BillboardCard;