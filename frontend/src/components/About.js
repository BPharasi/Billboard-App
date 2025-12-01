import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header isAdmin={false} />

      {/* Main Content */}
      <main className="flex-grow container mx-auto p-6 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">About HP Management</h2>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Who We Are</h3>
              <p>
                HP Management is a leading billboard advertising platform that connects businesses with premium outdoor advertising spaces across the region. We provide a modern, digital solution for managing and booking billboard advertisements.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Our Mission</h3>
              <p>
                To revolutionize outdoor advertising by making it accessible, transparent, and efficient for businesses of all sizes. We believe in the power of strategic billboard placement to drive brand visibility and customer engagement.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">What We Offer</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Premium billboard locations across major highways and urban centers</li>
                <li>Real-time availability and booking through our digital platform</li>
                <li>Transparent pricing with competitive rates</li>
                <li>Professional support for campaign planning and execution</li>
                <li>Analytics and performance tracking for your advertisements</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Why Choose HP Management?</h3>
              <p>
                With years of experience in the outdoor advertising industry, we understand what it takes to create impactful campaigns. Our platform combines cutting-edge technology with local market expertise to deliver results that matter to your business.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Contact Us</h3>
              <p>
                Ready to take your advertising to the next level? Get in touch with our team today.
              </p>
              <div className="mt-3 space-y-2">
                <p><strong>Email:</strong> info@hpmanagement.com</p>
                <p><strong>Phone:</strong> +27 (0) 123 456 789</p>
                <p><strong>Address:</strong> 123 Business Street, Johannesburg, South Africa</p>
              </div>
            </section>
          </div>

          <div className="mt-8 flex justify-center">
            <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
              Explore Billboards
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
