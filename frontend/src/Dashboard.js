import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EditModal from './EditModal';
import Header from './components/Header';
import Footer from './components/Footer';

const Dashboard = ({ token, setToken }) => {
  const [billboards, setBillboards] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBillboard, setSelectedBillboard] = useState(null);

  // image upload/create state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const navigate = useNavigate();

  // Use explicit base URL (set REACT_APP_API_URL=http://localhost:5000 in frontend/.env to avoid proxy issues)
  const API_BASE = process.env.REACT_APP_API_URL || '';

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchBillboards();
  }, [token, navigate]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  const fetchBillboards = async () => {
    try {
      // Use admin endpoint to get ALL billboards (including hidden ones)
      const url = `${API_BASE}/api/admin/billboards`;
      console.debug('Fetching billboards from', url);
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBillboards(res.data);
    } catch (err) {
      console.error('Fetch billboards error:', err);
      // Provide clearer message for network errors
      if (err.message === 'Network Error') {
        alert(
          'Network Error: failed to reach the backend.\n' +
          '• Is the backend running? (npm run start:server)\n' +
          '• If using the dev proxy, ensure frontend/package.json has "proxy": "http://localhost:5000" or set REACT_APP_API_URL.\n' +
          '• Check browser console for CORS errors or antivirus (e.g., Kaspersky) blocking requests.'
        );
      } else {
        alert('Error fetching billboards: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const toggleVisibility = async (id, currentVisible) => {
    try {
      await axios.put(
        `/api/admin/billboards/${id}`,
        { isVisible: !currentVisible },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBillboards();
    } catch (err) {
      alert('Error updating visibility: ' + err.message);
    }
  };

  const deleteBillboard = async (id) => {
    if (window.confirm('Are you sure you want to delete this billboard?')) {
      try {
        await axios.delete(`/api/admin/billboards/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchBillboards();
      } catch (err) {
        alert('Error deleting billboard: ' + err.message);
      }
    }
  };

  const openModal = (billboard = null) => {
    setSelectedBillboard(billboard);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBillboard(null);
  };

  const handleSave = () => {
    fetchBillboards();
    closeModal();
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    const oversized = files.find(f => f.size >= 5 * 1024 * 1024);
    if (oversized) {
      alert('Each image must be smaller than 5MB');
      return;
    }

    // Clean up old previews
    imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    
    setSelectedFiles(files);
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  const removeImage = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    URL.revokeObjectURL(imagePreviews[index]);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Not authenticated');
      return;
    }
    
    // Validate required fields
    if (selectedFiles.length === 0) {
      alert('Please select at least one image');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', e.target.name.value);
      formData.append('description', e.target.description.value || '');
      
      // Add price if provided
      const price = e.target.price.value;
      if (price) {
        formData.append('price', parseFloat(price));
      }
      
      // Add location data
      const address = e.target.address.value;
      const lat = e.target.latitude.value;
      const lng = e.target.longitude.value;
      
      if (address) {
        const location = { address };
        if (lat && lng) {
          location.lat = parseFloat(lat);
          location.lng = parseFloat(lng);
        }
        formData.append('location', JSON.stringify(location));
      }
      
      // Append multiple images
      selectedFiles.forEach((file, index) => {
        console.log(`Appending image ${index + 1}:`, file.name, file.size);
        formData.append('images', file);
      });

      console.log('Submitting billboard with', selectedFiles.length, 'images');

      const response = await axios.post('/api/admin/billboards', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Billboard created successfully:', response.data);

      // refresh list and reset form / preview
      fetchBillboards();
      e.target.reset();
      setSelectedFiles([]);
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
      setImagePreviews([]);
      
      alert('Billboard created successfully!');
    } catch (err) {
      console.error('Error creating billboard:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      alert('Error creating billboard: ' + errorMsg);
    }
  };

  const handleLogout = () => {
    setToken(null);
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header isAdmin={true} onLogout={handleLogout} />

      <div className="flex-grow container mx-auto p-6">
        <div className="mb-6">
          <form onSubmit={handleCreateSubmit} className="max-w-2xl bg-white p-6 rounded-lg shadow-lg border border-gray-200 space-y-4">
            <h2 className="text-lg font-semibold text-blue-900">Create New Billboard</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input name="name" required className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-600 focus:border-blue-600" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-600 focus:border-blue-600" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Price (R/month) (optional)</label>
              <input 
                name="price" 
                type="number" 
                step="0.01"
                placeholder="e.g., 5000"
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-600 focus:border-blue-600" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location Address *</label>
              <input 
                name="address" 
                required 
                placeholder="e.g., R24 Highway, Johannesburg"
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-600 focus:border-blue-600" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Latitude (optional)</label>
                <input 
                  name="latitude" 
                  type="number" 
                  step="any"
                  placeholder="e.g., -26.2041"
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-600 focus:border-blue-600" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Longitude (optional)</label>
                <input 
                  name="longitude" 
                  type="number" 
                  step="any"
                  placeholder="e.g., 28.0473"
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-600 focus:border-blue-600" 
                />
              </div>
            </div>

            <div className="text-xs text-gray-500">
              💡 GPS coordinates help display the exact location on the map. Leave blank to use address only.
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Billboard Images (Max 5)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full border-2 border-dashed border-blue-300 p-4 rounded-lg focus:ring-blue-600 cursor-pointer hover:border-blue-600 transition"
              />
              
              {imagePreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={preview} 
                        alt={`preview ${index + 1}`} 
                        className="w-full h-32 object-cover rounded-lg border border-gray-200" 
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Select up to 5 images. First image will be the main display.
              </p>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium">Create Billboard</button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <table className="table-auto w-full">
            <thead className="bg-blue-900 text-white border-b border-blue-800">
              <tr>
                <th className="p-3 text-left text-sm font-semibold">Name</th>
                <th className="p-3 text-left text-sm font-semibold">Location</th>
                <th className="p-3 text-left text-sm font-semibold">Visible</th>
                <th className="p-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {billboards.map((b) => (
                <tr key={b._id} className="hover:bg-blue-50 border-b border-gray-200">
                  <td className="p-3 text-sm text-gray-800">{b.name}</td>
                  <td className="p-3 text-sm text-gray-800">{b.location?.address || '—'}</td>
                  <td className="p-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!b.isVisible}
                        onChange={() => toggleVisibility(b._id, b.isVisible)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </td>
                  <td className="p-3 space-x-2">
                    <button onClick={() => openModal(b)} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium">Edit</button>
                    <button onClick={() => deleteBillboard(b._id)} className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 transition font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
          <EditModal
            billboard={selectedBillboard}
            token={token}
            onSave={handleSave}
            onClose={closeModal}
          />
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
