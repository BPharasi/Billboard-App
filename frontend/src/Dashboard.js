import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EditModal from './EditModal';

const Dashboard = ({ token, setToken }) => {
  const [billboards, setBillboards] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBillboard, setSelectedBillboard] = useState(null);

  // image upload/create state
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const navigate = useNavigate();

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
      const res = await axios.get('/api/billboards', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBillboards(res.data);
    } catch (err) {
      alert('Error fetching billboards: ' + err.message);
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="mb-6 flex items-center justify-between">
        <form onSubmit={handleCreateSubmit} className="w-full max-w-2xl bg-white p-4 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold">Create New Billboard</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input name="name" required className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Billboard Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full border-2 border-dashed p-4 rounded-lg focus:ring-gold-500 cursor-pointer"
            />
            {imagePreview && (
              <div className="mt-3">
                <img src={imagePreview} alt="preview" className="w-full h-48 object-cover rounded-lg" />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-gold-500 text-white rounded">Create Billboard</button>
          </div>
        </form>

        <div className="ml-4">
          <button onClick={() => openModal()} className="bg-gold-500 text-white p-2 rounded">Add / Edit in Modal</button>
        </div>
      </div>

      <table className="table-auto w-full border-collapse border border-gray-300 bg-white">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Name</th>
            <th className="border border-gray-300 p-2">Location</th>
            <th className="border border-gray-300 p-2">Price</th>
            <th className="border border-gray-300 p-2">Visible</th>
            <th className="border border-gray-300 p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {billboards.map((b) => (
            <tr key={b._id} className="hover:bg-gray-50">
              <td className="border border-gray-300 p-2">{b.name}</td>
              <td className="border border-gray-300 p-2">{b.location?.address || '—'}</td>
              <td className="border border-gray-300 p-2">R{b.price ?? '—'}</td>
              <td className="border border-gray-300 p-2">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={!!b.isVisible}
                    onChange={() => toggleVisibility(b._id, b.isVisible)}
                  />
                  <span className="slider"></span>
                </label>
              </td>
              <td className="border border-gray-300 p-2">
                <button onClick={() => openModal(b)} className="bg-blue-500 text-white px-2 py-1 rounded mr-2">Edit</button>
                <button onClick={() => deleteBillboard(b._id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <EditModal
          billboard={selectedBillboard}
          token={token}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default Dashboard;
