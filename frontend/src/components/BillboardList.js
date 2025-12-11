import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import BillboardModal from './BillboardModal';

const BillboardList = () => {
  const [billboards, setBillboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBillboard, setSelectedBillboard] = useState(null);

  useEffect(() => {
    const fetchBillboards = async () => {
      try {
        // Use relative path - works in both dev and production
        const res = await axios.get('/api/billboards');
        setBillboards(res.data);
      } catch (err) {
        console.error('Error fetching billboards:', err);
      }
    };
    fetchBillboards();
  }, []);

  const handleCardClick = (billboard) => {
    setSelectedBillboard(billboard);
  };

  const closeModal = () => {
    setSelectedBillboard(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header isAdmin={false} />

      <main className="flex-grow container mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-blue-900 mb-2">Available Billboards</h2>
          <p className="text-gray-600">Browse our premium billboard locations across Johannesburg</p>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading billboards...</p>
          </div>
        ) : billboards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No billboards available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {billboards.map((billboard) => (
              <div
                key={billboard._id}
                onClick={() => handleCardClick(billboard)}
                className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition cursor-pointer hover:border-blue-300"
              >
                <h3 className="text-2xl font-bold text-blue-900 mb-3">{billboard.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{billboard.description}</p>
                
                {billboard.location?.address && (
                  <div className="flex items-start text-gray-700 mb-4">
                    <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">{billboard.location.address}</span>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-sm text-blue-600 font-semibold">View Details</span>
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedBillboard && (
        <BillboardModal billboard={selectedBillboard} onClose={closeModal} />
      )}

      <Footer />
    </div>
  );
};

export default BillboardList;
