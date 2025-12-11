import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BillboardCard from './BillboardCard';
import Header from './Header';
import Footer from './Footer';

const BillboardList = () => {
  const [billboards, setBillboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBillboard, setSelectedBillboard] = useState(null);

  useEffect(() => {
    const fetchBillboards = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/billboards'); // <-- NO localhost!
        console.log('✅ Fetched billboards:', res.data);
        console.log('✅ Number of billboards:', res.data.length);
        setBillboards(res.data);
      } catch (err) {
        console.error('❌ Error fetching billboards:', err);
      } finally {
        setLoading(false);
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
          <p className="text-gray-600 mb-6">Browse our premium billboard locations across Johannesburg</p>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            <p className="text-gray-600 mt-4">Loading billboards...</p>
          </div>
        ) : billboards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 text-lg">No billboards available at the moment.</p>
            <p className="text-gray-500 mt-2">Check back soon for new locations!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {billboards.map((billboard) => (
              <BillboardCard key={billboard._id} billboard={billboard} />
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
