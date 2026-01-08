import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ isAdmin = false, onLogout = null, token = null, setToken = null }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/');
  };

  return (
    <header className="bg-white text-blue-900 shadow-md py-2 sm:py-4 px-3 sm:px-6 border-b-2 border-blue-900">
      <div className="container mx-auto">
        {/* Mobile: Stacked Layout */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-2">
            {/* Logo */}
            <Link to="/admin/login" className="flex items-center hover:opacity-80 transition">
              <img src="/logo.png" alt="HP Management Logo" className="h-16 w-16" />
            </Link>
            
            {/* Site Name */}
            <Link to="/" className="flex-1 text-center">
              <h1 className="text-xl font-bold">HP Management</h1>
            </Link>

            {/* Logout Button (Mobile) */}
            {(isAdmin || token) && (
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-blue-900 text-white rounded hover:bg-blue-800 transition font-medium text-sm"
              >
                Logout
              </button>
            )}
          </div>

          {/* Navigation (Mobile) */}
          <nav className="flex items-center justify-center space-x-2">
            {!isAdmin && !token && (
              <>
                <Link to="/" className="px-3 py-1 hover:bg-blue-50 rounded transition font-medium text-sm">Home</Link>
                <Link to="/billboards" className="px-3 py-1 hover:bg-blue-50 rounded transition font-medium text-sm">Billboards</Link>
                <Link to="/contact" className="px-3 py-1 hover:bg-blue-50 rounded transition font-medium text-sm">Contact</Link>
              </>
            )}
            
            {(isAdmin || token) && (
              <>
                <Link to="/admin/dashboard" className="px-3 py-1 hover:bg-blue-50 rounded transition font-medium text-sm">Dashboard</Link>
                <Link to="/admin/rentals" className="px-3 py-1 hover:bg-blue-50 rounded transition font-medium text-sm">Rentals</Link>
              </>
            )}
          </nav>
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden md:grid grid-cols-3 items-center">
          {/* Left: Logo */}
          <Link to="/admin/login" className="flex items-center hover:opacity-80 transition">
            <img src="/logo.png" alt="HP Management Logo" className="h-20 w-20 lg:h-24 lg:w-24" />
          </Link>
          
          {/* Center: Site Name */}
          <Link to="/" className="flex justify-center">
            <h1 className="text-2xl lg:text-3xl font-bold">HP Management</h1>
          </Link>
          
          {/* Right: Navigation */}
          <nav className="flex items-center justify-end space-x-2 lg:space-x-4">
            {!isAdmin && !token && (
              <>
                <Link to="/" className="px-3 lg:px-4 py-2 hover:bg-blue-50 rounded transition font-medium text-base lg:text-lg">Home</Link>
                <Link to="/billboards" className="px-3 lg:px-4 py-2 hover:bg-blue-50 rounded transition font-medium text-base lg:text-lg">Billboards</Link>
                <Link to="/contact" className="px-3 lg:px-4 py-2 hover:bg-blue-50 rounded transition font-medium text-base lg:text-lg">Contact</Link>
              </>
            )}
            
            {(isAdmin || token) && (
              <>
                <Link to="/admin/dashboard" className="px-3 lg:px-4 py-2 hover:bg-blue-50 rounded transition font-medium text-base lg:text-lg">Dashboard</Link>
                <Link to="/admin/rentals" className="px-3 lg:px-4 py-2 hover:bg-blue-50 rounded transition font-medium text-base lg:text-lg">Rentals</Link>
                <button
                  onClick={handleLogout}
                  className="px-3 lg:px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition font-medium text-base lg:text-lg"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
