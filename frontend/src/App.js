import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Navbar from './Navbar';
import Home from './Home';
import AdminLogin from './components/AdminLogin';
import Dashboard from './Dashboard';
import About from './components/About';
import ContactUs from './components/ContactUs';
import LandingPage from './components/LandingPage';
import BillboardList from './components/BillboardList';

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Remove or comment out the hardcoded baseURL
// axios.defaults.baseURL = 'http://localhost:5000'; // ❌ DELETE THIS LINE

// Use environment variable or empty string for relative paths
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '';

// AuthContext
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  return (
    <AuthContext.Provider value={{ token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// ErrorBoundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

// Footer
const Footer = () => (
  <footer className="bg-gold-500 text-white p-4 text-center">
    HP Management - Premium Outdoor Advertising
  </footer>
);

const AppContent = () => {
  const { token, setToken } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    navigate('/');
  };

  return (
    <div className="font-sans text-gray-800 bg-gradient-to-br from-gold-100 to-gray-50 min-h-screen flex flex-col">
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/billboards" element={<BillboardList />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/admin/login" element={<AdminLogin setToken={setToken} />} />
          <Route path="/admin/dashboard" element={<Dashboard token={token} setToken={setToken} />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

// Simple toast helper (replace with your toast lib if present)
const showToast = (msg) => {
	alert(msg);
};

// ErrorBoundary class to catch render errors (including upload UI rendering errors)
class UploadErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false };
	}
	static getDerivedStateFromError() {
		return { hasError: true };
	}
	componentDidCatch(error, info) {
		console.error('UploadErrorBoundary caught error', error, info);
	}
	render() {
		if (this.state.hasError) {
			return (
				<div className="p-4">
					<h2 className="text-xl font-semibold">Something went wrong</h2>
					<p>Please refresh the page or try again later.</p>
				</div>
			);
		}
		return this.props.children;
	}
}

// Attach axios interceptors: attach token and map 413 to user-friendly toast
// Token retrieval: prefer context/store; fallback to localStorage 'token'
axios.interceptors.request.use((config) => {
	const token = config.headers?.Authorization || localStorage.getItem('token');
	if (token && !config.headers.Authorization) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Response interceptor: handle 413 and show toast
axios.interceptors.response.use(
	(res) => res,
	(err) => {
		const status = err?.response?.status;
		if (status === 413 || (err?.response?.data?.error === 'File too large' || err?.response?.data?.error === 'File too large')) {
			showToast('Upload failed: file too large (max 5MB)');
		} else if (err?.response?.data?.error) {
			// generic backend message
			showToast('Upload failed: ' + err.response.data.error);
		}
		return Promise.reject(err);
	}
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <UploadErrorBoundary>
            <AppContent />
          </UploadErrorBoundary>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
