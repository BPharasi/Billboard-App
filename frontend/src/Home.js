import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BillboardCard from './BillboardCard';
import MapView from './MapView';

const Home = () => {
  const [billboards, setBillboards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBillboards = async () => {
      try {
        const res = await axios.get('/api/billboards');
        setBillboards(res.data);
      } catch (err) {
        alert('Error fetching billboards: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBillboards();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Billboards in Johannesburg</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {billboards.filter(b => b.isVisible).map(b => <BillboardCard key={b._id} billboard={b} />)}
      </div>
      <MapView billboards={billboards.filter(b => b.isVisible)} />
    </div>
  );
};

export default Home;
