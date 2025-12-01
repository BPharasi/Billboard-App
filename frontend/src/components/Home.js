import React from 'react';
import Header from './Header';
import Footer from './Footer';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header isAdmin={false} />

      {/* Main content */}
      <div className="flex-grow container mx-auto p-6">
        {/* ...existing code... */}
      </div>

      <Footer />
    </div>
  );
};

export default Home;