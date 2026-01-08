import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';

const RentalManagement = ({ token, setToken }) => {
  const [rentals, setRentals] = useState([]);
  const [billboards, setBillboards] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClientDetailsOpen, setIsClientDetailsOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [viewingRental, setViewingRental] = useState(null);
  const [contractFile, setContractFile] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
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
    notes: '',
    // Client Details
    'clientDetails.legalName': '',
    'clientDetails.businessRegNumber': '',
    'clientDetails.physicalAddress': '',
    'clientDetails.postalAddress': '',
    'clientDetails.uniqueClientId': '',
    // Service Details
    'serviceDetails.billboardLocations': '',
    'serviceDetails.billboardSizes': '',
    'serviceDetails.billboardTypes': '',
    'serviceDetails.additionalServices': '',
    'serviceDetails.artworkRequirements': '',
    'serviceDetails.approvalProcess': '',
    'serviceDetails.contentRestrictions': '',
    'serviceDetails.expectedImpressions': '',
    'serviceDetails.visibilityReports': '',
    'serviceDetails.analyticsNotes': '',
    // Payment Terms
    'paymentTerms.totalCost': '',
    'paymentTerms.costBreakdown': '',
    'paymentTerms.paymentSchedule': '',
    'paymentTerms.depositAmount': '',
    'paymentTerms.depositPaid': false,
    'paymentTerms.paymentMethod': '',
    'paymentTerms.latePaymentPenalty': '',
    'paymentTerms.taxRate': 15,
    'paymentTerms.currency': 'ZAR',
    'paymentTerms.escalationClause': ''
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

  const openClientDetails = (rental) => {
    setViewingRental(rental);
    setIsClientDetailsOpen(true);
  };

  const closeClientDetails = () => {
    setIsClientDetailsOpen(false);
    setViewingRental(null);
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
                    <td className="p-3 text-sm">
                      <button
                        onClick={() => openClientDetails(rental)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-left"
                      >
                        {rental.clientName}
                      </button>
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

                {/* Advanced Details Toggle */}
                <div className="border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                  >
                    <span className="text-sm font-semibold text-gray-700">
                      📋 Advanced Details (Optional)
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-600 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Advanced Details Section */}
                {showAdvanced && (
                  <div className="space-y-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                    
                    {/* Client Details Section */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">🏢</span> Legal & Registration Details
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Legal Company Name</label>
                            <input
                              type="text"
                              name="clientDetails.legalName"
                              value={formData['clientDetails.legalName']}
                              onChange={handleChange}
                              placeholder="Full registered business name"
                              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Business Registration Number</label>
                            <input
                              type="text"
                              name="clientDetails.businessRegNumber"
                              value={formData['clientDetails.businessRegNumber']}
                              onChange={handleChange}
                              placeholder="Company reg number"
                              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Unique Client ID</label>
                          <input
                            type="text"
                            name="clientDetails.uniqueClientId"
                            value={formData['clientDetails.uniqueClientId']}
                            onChange={handleChange}
                            placeholder="Internal client reference number"
                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Physical Address</label>
                          <textarea
                            name="clientDetails.physicalAddress"
                            value={formData['clientDetails.physicalAddress']}
                            onChange={handleChange}
                            rows="2"
                            placeholder="Street address, city, postal code"
                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Postal Address</label>
                          <textarea
                            name="clientDetails.postalAddress"
                            value={formData['clientDetails.postalAddress']}
                            onChange={handleChange}
                            rows="2"
                            placeholder="P.O. Box or postal address"
                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Service Details Section */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">📊</span> Service Description
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Billboard Locations (GPS/Address)</label>
                          <textarea
                            name="serviceDetails.billboardLocations"
                            value={formData['serviceDetails.billboardLocations']}
                            onChange={handleChange}
                            rows="2"
                            placeholder="e.g., -26.123, 28.456 or Main St & 5th Ave"
                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Billboard Sizes</label>
                            <input
                              type="text"
                              name="serviceDetails.billboardSizes"
                              value={formData['serviceDetails.billboardSizes']}
                              onChange={handleChange}
                              placeholder="e.g., 6m x 3m"
                              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Billboard Types</label>
                            <input
                              type="text"
                              name="serviceDetails.billboardTypes"
                              value={formData['serviceDetails.billboardTypes']}
                              onChange={handleChange}
                              placeholder="e.g., Digital, Static"
                              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Expected Impressions</label>
                            <input
                              type="number"
                              name="serviceDetails.expectedImpressions"
                              value={formData['serviceDetails.expectedImpressions']}
                              onChange={handleChange}
                              placeholder="Monthly views"
                              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Additional Services</label>
                          <textarea
                            name="serviceDetails.additionalServices"
                            value={formData['serviceDetails.additionalServices']}
                            onChange={handleChange}
                            rows="2"
                            placeholder="e.g., Installation, maintenance, design services"
                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Artwork Requirements</label>
                            <textarea
                              name="serviceDetails.artworkRequirements"
                              value={formData['serviceDetails.artworkRequirements']}
                              onChange={handleChange}
                              rows="2"
                              placeholder="File formats, resolution, specifications"
                              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Approval Process</label>
                            <textarea
                              name="serviceDetails.approvalProcess"
                              value={formData['serviceDetails.approvalProcess']}
                              onChange={handleChange}
                              rows="2"
                              placeholder="Steps for content approval"
                              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Content Restrictions</label>
                            <textarea
                              name="serviceDetails.contentRestrictions"
                              value={formData['serviceDetails.contentRestrictions']}
                              onChange={handleChange}
                              rows="2"
                              placeholder="Prohibited content or themes"
                              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Analytics Notes</label>
                            <textarea
                              name="serviceDetails.analyticsNotes"
                              value={formData['serviceDetails.analyticsNotes']}
                              onChange={handleChange}
                              rows="2"
                              placeholder="Reporting requirements, KPIs"
                              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Terms Section */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">💰</span> Payment Terms
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Total Cost</label>
                            <input
                              type="number"
                              name="paymentTerms.totalCost"
                              value={formData['paymentTerms.totalCost']}
                              onChange={handleChange}
                              step="0.01"
                              placeholder="Full contract value"
                              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Currency</label>
                            <select
                              name="paymentTerms.currency"
                              value={formData['paymentTerms.currency']}
                              onChange={handleChange}
                              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            >
                              <option value="ZAR">ZAR (R)</option>
                              <option value="USD">USD ($)</option>
                              <option value="EUR">EUR (€)</option>
                              <option value="GBP">GBP (£)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
                            <input
                              type="number"
                              name="paymentTerms.taxRate"
                              value={formData['paymentTerms.taxRate']}
                              onChange={handleChange}
                              step="0.01"
                              placeholder="15"
                              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Deposit Amount</label>
                            <input
                              type="number"
                              name="paymentTerms.depositAmount"
                              value={formData['paymentTerms.depositAmount']}
                              onChange={handleChange}
                              step="0.01"
                              placeholder="Required upfront deposit"
                              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                            <input
                              type="text"
                              name="paymentTerms.paymentMethod"
                              value={formData['paymentTerms.paymentMethod']}
                              onChange={handleChange}
                              placeholder="e.g., EFT, Credit Card, Cash"
                              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="paymentTerms.depositPaid"
                            checked={formData['paymentTerms.depositPaid']}
                            onChange={(e) => setFormData(prev => ({ ...prev, 'paymentTerms.depositPaid': e.target.checked }))}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <label className="ml-2 text-sm font-medium text-gray-700">
                            Deposit has been paid
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Cost Breakdown</label>
                          <textarea
                            name="paymentTerms.costBreakdown"
                            value={formData['paymentTerms.costBreakdown']}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Itemized costs (e.g., Billboard rental: R5000, Installation: R1000)"
                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Payment Schedule</label>
                          <textarea
                            name="paymentTerms.paymentSchedule"
                            value={formData['paymentTerms.paymentSchedule']}
                            onChange={handleChange}
                            rows="2"
                            placeholder="e.g., 50% upfront, 50% on completion OR Monthly on 1st of each month"
                            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Late Payment Penalty</label>
                            <input
                              type="text"
                              name="paymentTerms.latePaymentPenalty"
                              value={formData['paymentTerms.latePaymentPenalty']}
                              onChange={handleChange}
                              placeholder="e.g., 2% per week"
                              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Escalation Clause</label>
                            <input
                              type="text"
                              name="paymentTerms.escalationClause"
                              value={formData['paymentTerms.escalationClause']}
                              onChange={handleChange}
                              placeholder="e.g., Annual 5% increase"
                              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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

        {/* Client Details Modal */}
        {isClientDetailsOpen && viewingRental && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-blue-900">Client & Contract Details</h2>
                    <p className="text-sm text-gray-600 mt-1">{viewingRental.clientName} • {viewingRental.billboard?.name}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {viewingRental.contractPDF && (
                      <a
                        href={viewingRental.contractPDF}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        View Contract
                      </a>
                    )}
                    <button
                      onClick={closeClientDetails}
                      className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Client Information */}
                <section className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Client Name</label>
                      <p className="text-gray-900">{viewingRental.clientName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Company</label>
                      <p className="text-gray-900">{viewingRental.clientCompany || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{viewingRental.clientEmail}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900">{viewingRental.clientPhone || '—'}</p>
                    </div>
                  </div>
                </section>

                {/* Detailed Client Information */}
                <section className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Legal & Registration Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Legal Name</label>
                      <p className="text-gray-900">{viewingRental.clientDetails?.legalName || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Business Registration Number (CIPC)</label>
                      <p className="text-gray-900">{viewingRental.clientDetails?.businessRegNumber || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Unique Client ID</label>
                      <p className="text-gray-900 font-mono">{viewingRental.clientDetails?.uniqueClientId || '—'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Physical Address</label>
                      <p className="text-gray-900 whitespace-pre-line">{viewingRental.clientDetails?.physicalAddress || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Postal Address</label>
                      <p className="text-gray-900 whitespace-pre-line">{viewingRental.clientDetails?.postalAddress || '—'}</p>
                    </div>
                  </div>

                  {/* Representatives */}
                  {viewingRental.clientDetails?.representatives && viewingRental.clientDetails.representatives.length > 0 && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-600 block mb-2">Key Representatives</label>
                      <div className="space-y-2">
                        {viewingRental.clientDetails.representatives.map((rep, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded">
                            <p className="font-medium">{rep.name} {rep.position && `- ${rep.position}`}</p>
                            <p className="text-sm text-gray-600">{rep.email} {rep.phone && `• ${rep.phone}`}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Service Details */}
                <section className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Service Description</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Billboard Locations (GPS/Address)</label>
                      <p className="text-gray-900 whitespace-pre-line">{viewingRental.serviceDetails?.billboardLocations || '—'}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Sizes</label>
                        <p className="text-gray-900">{viewingRental.serviceDetails?.billboardSizes || '—'}</p>
                      </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Types</label>
                        <p className="text-gray-900">{viewingRental.serviceDetails?.billboardTypes || '—'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Expected Impressions</label>
                        <p className="text-gray-900">{viewingRental.serviceDetails?.expectedImpressions?.toLocaleString() || '—'}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Additional Services</label>
                      <p className="text-gray-900 whitespace-pre-line">{viewingRental.serviceDetails?.additionalServices || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Artwork Requirements</label>
                      <p className="text-gray-900 whitespace-pre-line">{viewingRental.serviceDetails?.artworkRequirements || '—'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Approval Process</label>
                      <p className="text-gray-900 whitespace-pre-line">{viewingRental.serviceDetails?.approvalProcess || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Content Restrictions</label>
                      <p className="text-gray-900 whitespace-pre-line">{viewingRental.serviceDetails?.contentRestrictions || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Analytics Notes</label>
                      <p className="text-gray-900 whitespace-pre-line">{viewingRental.serviceDetails?.analyticsNotes || '—'}</p>
                    </div>

                    {/* Milestones */}
                    {viewingRental.serviceDetails?.milestones && viewingRental.serviceDetails.milestones.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 block mb-2">Milestones & Deliverables</label>
                          <div className="space-y-2">
                            {viewingRental.serviceDetails.milestones.map((milestone, idx) => (
                              <div key={idx} className="bg-gray-50 p-3 rounded flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{milestone.description}</p>
                                  <p className="text-sm text-gray-600">{new Date(milestone.date).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded ${milestone.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {milestone.completed ? '✓ Complete' : 'Pending'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </section>

                {/* Payment Terms */}
                <section className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Terms</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Total Cost</label>
                        <p className="text-gray-900 text-xl font-bold">
                        {viewingRental.paymentTerms?.currency || 'ZAR'} {viewingRental.paymentTerms?.totalCost?.toLocaleString() || viewingRental.totalAmount?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tax Rate (VAT)</label>
                      <p className="text-gray-900">{viewingRental.paymentTerms?.taxRate || 15}%</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Deposit Amount</label>
                        <p className="text-gray-900">
                        {viewingRental.paymentTerms?.depositAmount?.toLocaleString() || '—'}
                        {viewingRental.paymentTerms?.depositPaid && <span className="ml-2 text-green-600 font-medium">✓ Paid</span>}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Payment Method</label>
                      <p className="text-gray-900">{viewingRental.paymentTerms?.paymentMethod || '—'}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Cost Breakdown</label>
                        <p className="text-gray-900 whitespace-pre-line">{viewingRental.paymentTerms?.costBreakdown || '—'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Payment Schedule</label>
                        <p className="text-gray-900 whitespace-pre-line">{viewingRental.paymentTerms?.paymentSchedule || '—'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Late Payment Penalty</label>
                        <p className="text-gray-900">{viewingRental.paymentTerms?.latePaymentPenalty || '—'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Escalation Clause</label>
                        <p className="text-gray-900 whitespace-pre-line">{viewingRental.paymentTerms?.escalationClause || '—'}</p>
                      </div>
                      {viewingRental.paymentTerms?.invoiceNumbers && viewingRental.paymentTerms.invoiceNumbers.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Invoice Numbers</label>
                          <p className="text-gray-900 font-mono">{viewingRental.paymentTerms.invoiceNumbers.join(', ')}</p>
                        </div>
                      )}
                      {viewingRental.paymentTerms?.paymentIds && viewingRental.paymentTerms.paymentIds.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Payment IDs</label>
                          <p className="text-gray-900 font-mono">{viewingRental.paymentTerms.paymentIds.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </section>

                {/* Contract Information */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Contract Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Start Date</label>
                      <p className="text-gray-900">{new Date(viewingRental.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">End Date</label>
                      <p className="text-gray-900">{new Date(viewingRental.endDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Duration</label>
                      <p className="text-gray-900">{viewingRental.contractDuration} months</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Monthly Rate</label>
                      <p className="text-gray-900 font-semibold">R{viewingRental.monthlyRate?.toLocaleString()}</p>
                    </div>
                  </div>
                  {viewingRental.notes && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-600">Notes</label>
                      <p className="text-gray-900 whitespace-pre-line bg-gray-50 p-3 rounded">{viewingRental.notes}</p>
                    </div>
                  )}
                  {viewingRental.contractPDF && (
                    <div className="mt-4">
                      <a
                        href={viewingRental.contractPDF}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                      >
                        📄 View Contract PDF
                      </a>
                    </div>
                  )}
                </section>
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end">
                <button
                  onClick={closeClientDetails}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default RentalManagement;
