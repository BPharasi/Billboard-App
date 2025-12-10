import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ isAdmin = false, onLogout = null, token = null, setToken = null }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else if (setToken) {
      localStorage.removeItem('token');
      setToken(null);
      navigate('/admin/login');
    }
  };

  return (
    <header className="bg-white text-blue-900 shadow-md py-4 px-6 border-b-2 border-blue-900">
      <div className="container mx-auto grid grid-cols-3 items-center">
        {/* Left: Logo - Links to Admin Login */}
        <Link to="/admin/login" className="flex items-center hover:opacity-80 transition">
          <img src="/logo.png" alt="HP Management Logo" className="h-24 w-24" />
        </Link>
        
        {/* Center: Site Name */}
        <Link to="/" className="flex justify-center">
          <h1 className="text-3xl font-bold">HP Management</h1>
        </Link>
        
        {/* Right: Navigation */}
        <nav className="flex items-center justify-end space-x-4">
          {!isAdmin && !token && (
            <>
              <Link to="/" className="px-4 py-2 hover:bg-blue-50 rounded transition font-medium text-lg">Home</Link>
              <Link to="/billboards" className="px-4 py-2 hover:bg-blue-50 rounded transition font-medium text-lg">Billboards</Link>
              <Link to="/contact" className="px-4 py-2 hover:bg-blue-50 rounded transition font-medium text-lg">Contact</Link>
            </>
          )}
          
          {(isAdmin || token) && (
            <>
              <Link to="/admin/dashboard" className="px-4 py-2 hover:bg-blue-50 rounded transition font-medium text-lg">Dashboard</Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition font-medium text-lg"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
