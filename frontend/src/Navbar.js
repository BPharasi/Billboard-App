import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ token, setToken }) => {
  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
  };

  return (
    <nav className="bg-gold-500 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-xl font-bold">Billboard App</Link>
        {token ? (
          <div className="flex space-x-4">
            <Link to="/admin/dashboard" className="text-white hover:underline">Dashboard</Link>
            <button onClick={logout} className="text-white hover:underline">Logout</button>
          </div>
        ) : (
          <Link to="/admin/login" className="text-white hover:underline">Admin Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
