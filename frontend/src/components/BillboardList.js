import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';

const BillboardList = () => {
  const [billboards, setBillboards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillboards();
  }, []);

  const fetchBillboards = async () => {
    try {
      const res = await axios.get('/api/billboards');
      setBillboards(res.data);
    } catch (err) {
      console.error('Error fetching billboards:', err);
    } finally {
      setLoading(false);
    }
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
              <div key={billboard._id} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition">
                {billboard.imagePath && (
                  <img 
                    src={billboard.imagePath} 
                    alt={billboard.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-xl font-bold text-blue-900 mb-2">{billboard.name}</h3>
                  <p className="text-gray-600 mb-3 line-clamp-2">{billboard.description}</p>
                  {billboard.location?.address && (
                    <p className="text-sm text-gray-500">📍 {billboard.location.address}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BillboardList;
