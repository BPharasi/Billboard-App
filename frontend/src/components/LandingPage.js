import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header isAdmin={false} />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">Premium Billboard Advertising</h1>
          <p className="text-xl mb-8">Reach your audience with strategic outdoor advertising</p>
          <div className="flex justify-center space-x-4">
            <Link 
              to="/billboards" 
              className="px-8 py-4 bg-white text-blue-900 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-lg"
            >
              Browse Billboards
            </Link>
            <Link 
              to="/contact" 
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-500 transition border-2 border-white"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">Why Choose HP Management?</h2>
          
          <div className="flex justify-center">
            <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-lg transition max-w-md">
              <div className="text-blue-900 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">Prime Sites for your advertisements</h3>
              <p className="text-gray-600">Strategic placements on major highways and high-traffic urban areas</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-gray-700 mb-8">Explore our available billboard locations and start your campaign today</p>
          <Link 
            to="/billboards" 
            className="inline-block px-10 py-4 bg-blue-900 text-white rounded-lg font-bold text-lg hover:bg-blue-800 transition shadow-lg"
          >
            View All Billboards
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
