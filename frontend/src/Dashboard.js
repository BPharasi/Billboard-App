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
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const fetchBillboards = async () => {
    try {
      const url = `${API_BASE}/api/billboards`;
      // debug log to help diagnose network issues
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
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size >= 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Not authenticated');
      return;
    }
    try {
      const formData = new FormData();
      // match backend naming: use 'name' and 'description' (adjust if backend expects different fields)
      formData.append('name', e.target.name.value);
      formData.append('description', e.target.description.value);
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      await axios.post('/api/admin/billboards', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // refresh list and reset form / preview
      fetchBillboards();
      e.target.reset();
      setSelectedFile(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
    } catch (err) {
      console.error(err);
      alert('Error creating billboard: ' + (err.response?.data?.error || err.message));
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Billboard Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full border-2 border-dashed border-blue-300 p-4 rounded-lg focus:ring-blue-600 cursor-pointer hover:border-blue-600 transition"
              />
              {imagePreview && (
                <div className="mt-3 relative">
                  <img src={imagePreview} alt="preview" className="w-full h-48 object-cover rounded-lg border border-gray-200" />
                </div>
              )}
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
