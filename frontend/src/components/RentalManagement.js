import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';

const RentalManagement = ({ token, setToken }) => {
  const [rentals, setRentals] = useState([]);
  const [billboards, setBillboards] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [contractFile, setContractFile] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    billboard: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCompany: '',
    startDate: '',
    endDate: '',
    monthlyRate: '',
    notes: ''
  });

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchRentals();
    fetchBillboards();
  }, [token, navigate]);

  const fetchRentals = async () => {
    try {
      const res = await axios.get('/api/admin/rentals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRentals(res.data);
    } catch (err) {
      console.error('Error fetching rentals:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        setToken(null);
        navigate('/admin/login');
      }
    }
  };

  const fetchBillboards = async () => {
    try {
      const res = await axios.get('/api/admin/billboards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBillboards(res.data);
    } catch (err) {
      console.error('Error fetching billboards:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setContractFile(e.target.files[0]);
  };

  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.ceil(diffDays / 30); // Convert to months
    return months;
  };

  const calculateTotalAmount = (monthlyRate, durationMonths) => {
    return (monthlyRate * durationMonths).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      const duration = calculateDuration(formData.startDate, formData.endDate);
      const totalAmount = calculateTotalAmount(parseFloat(formData.monthlyRate), duration);
      
      submitData.append('contractDuration', duration);
      submitData.append('totalAmount', totalAmount);

      if (contractFile) {
        submitData.append('contract', contractFile);
      }

      if (selectedRental) {
        await axios.put(`/api/admin/rentals/${selectedRental._id}`, submitData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        alert('Rental updated successfully!');
      } else {
        await axios.post('/api/admin/rentals', submitData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        alert('Rental created successfully!');
      }

      fetchRentals();
      closeModal();
    } catch (err) {
      console.error('Error saving rental:', err);
      alert('Error saving rental: ' + (err.response?.data?.error || err.message));
    }
  };

  const openModal = (rental = null) => {
    if (rental) {
      setSelectedRental(rental);
      setFormData({
        billboard: rental.billboard?._id || rental.billboard,
        clientName: rental.clientName,
        clientEmail: rental.clientEmail,
        clientPhone: rental.clientPhone || '',
        clientCompany: rental.clientCompany || '',
        startDate: new Date(rental.startDate).toISOString().split('T')[0],
        endDate: new Date(rental.endDate).toISOString().split('T')[0],
        monthlyRate: rental.monthlyRate,
        notes: rental.notes || ''
      });
    } else {
      setSelectedRental(null);
      setFormData({
        billboard: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        clientCompany: '',
        startDate: '',
        endDate: '',
        monthlyRate: '',
        notes: ''
      });
    }
    setContractFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRental(null);
    setContractFile(null);
  };

  const deleteRental = async (id) => {
    if (window.confirm('Are you sure you want to delete this rental?')) {
      try {
        await axios.delete(`/api/admin/rentals/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchRentals();
        alert('Rental deleted successfully!');
      } catch (err) {
        alert('Error deleting rental: ' + err.message);
      }
    }
  };

  const checkReminders = async () => {
    try {
      const res = await axios.post('/api/admin/rentals/check-reminders', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Reminders checked!\n\nSent: ${res.data.totalSent}\nErrors: ${res.data.totalErrors}\n\n${res.data.results.sent.map(s => `✅ ${s.clientName} - ${s.reminderType} (${s.daysLeft} days left)`).join('\n')}`);
      fetchRentals(); // Refresh to show updated reminder status
    } catch (err) {
      alert('Error checking reminders: ' + err.message);
    }
  };

  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (rental) => {
    const daysLeft = getDaysRemaining(rental.endDate);
    
    if (daysLeft < 0) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Expired</span>;
    } else if (daysLeft <= 7 && rental.contractDuration === 1) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">⚠️ Expiring Soon</span>;
    } else if (daysLeft <= 14 && rental.contractDuration >= 3) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">⚠️ Expiring Soon</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
    }
  };

  const handleLogout = () => {
    setToken(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header isAdmin={true} onLogout={handleLogout} />

      <div className="flex-grow container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">Rental Management</h1>
          <div className="flex gap-2">
            <button
              onClick={checkReminders}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium"
            >
              🔔 Check Reminders
            </button>
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
            >
              + New Rental
            </button>
          </div>
        </div>

        {/* Alerts for expiring contracts */}
        {rentals.filter(r => {
          const daysLeft = getDaysRemaining(r.endDate);
          return (daysLeft <= 7 && r.contractDuration === 1) || (daysLeft <= 14 && r.contractDuration >= 3);
        }).length > 0 && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Contracts Expiring Soon</h3>
                <p className="mt-2 text-sm text-yellow-700">
                  You have {rentals.filter(r => {
                    const daysLeft = getDaysRemaining(r.endDate);
                    return (daysLeft <= 7 && r.contractDuration === 1) || (daysLeft <= 14 && r.contractDuration >= 3);
                  }).length} contract(s) expiring soon. Review below.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-x-auto">
          <table className="table-auto w-full min-w-[1000px]">
            <thead className="bg-blue-900 text-white border-b border-blue-800">
              <tr>
                <th className="p-3 text-left text-sm font-semibold">Billboard</th>
                <th className="p-3 text-left text-sm font-semibold">Client</th>
                <th className="p-3 text-left text-sm font-semibold">Company</th>
                <th className="p-3 text-left text-sm font-semibold">Start Date</th>
                <th className="p-3 text-left text-sm font-semibold">End Date</th>
                <th className="p-3 text-left text-sm font-semibold">Days Left</th>
                <th className="p-3 text-left text-sm font-semibold">Status</th>
                <th className="p-3 text-left text-sm font-semibold">Amount</th>
                <th className="p-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map((rental) => {
                const daysLeft = getDaysRemaining(rental.endDate);
                return (
                  <tr key={rental._id} className="hover:bg-blue-50 border-b border-gray-200">
                    <td className="p-3 text-sm text-gray-800">
                      {rental.billboard?.name || 'N/A'}
                    </td>
                    <td className="p-3 text-sm text-gray-800">
                      <div>{rental.clientName}</div>
                      <div className="text-xs text-gray-500">{rental.clientEmail}</div>
                    </td>
                    <td className="p-3 text-sm text-gray-800">{rental.clientCompany || '—'}</td>
                    <td className="p-3 text-sm text-gray-800">
                      {new Date(rental.startDate).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-sm text-gray-800">
                      {new Date(rental.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-sm text-gray-800 font-semibold">
                      {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                    </td>
                    <td className="p-3">{getStatusBadge(rental)}</td>
                    <td className="p-3 text-sm text-gray-800 font-semibold">
                      R{rental.totalAmount?.toLocaleString()}
                    </td>
                    <td className="p-3 space-x-2">
                      <button
                        onClick={() => openModal(rental)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                      >
                        Edit
                      </button>
                      {rental.contractPDF && (
                        <a
                          href={rental.contractPDF}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                        >
                          PDF
                        </a>
                      )}
                      <button
                        onClick={() => deleteRental(rental._id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-blue-900">
                  {selectedRental ? 'Edit Rental' : 'New Rental'}
                </h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Billboard *</label>
                  <select
                    name="billboard"
                    value={formData.billboard}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">Select a billboard</option>
                    {billboards.map(bb => (
                      <option key={bb._id} value={bb._id}>{bb.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Client Name *</label>
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company</label>
                    <input
                      type="text"
                      name="clientCompany"
                      value={formData.clientCompany}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      name="clientEmail"
                      value={formData.clientEmail}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      name="clientPhone"
                      value={formData.clientPhone}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date *</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Monthly Rate (R) *</label>
                  <input
                    type="number"
                    name="monthlyRate"
                    value={formData.monthlyRate}
                    onChange={handleChange}
                    required
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Upload Contract (PDF)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {selectedRental?.contractPDF && (
                    <p className="text-xs text-gray-500 mt-1">
                      Current: <a href={selectedRental.contractPDF} target="_blank" rel="noopener noreferrer" className="text-blue-600">View Contract</a>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {selectedRental ? 'Update' : 'Create'} Rental
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default RentalManagement;
