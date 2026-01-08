import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditModal = ({ billboard, token, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    price: '',
    size: '',
    type: '',
    isVisible: true
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    if (billboard) {
      setFormData({
        name: billboard.name || '',
        description: billboard.description || '',
        address: billboard.location?.address || '',
        latitude: billboard.location?.lat || '',
        longitude: billboard.location?.lng || '',
        price: billboard.price || '',
        size: billboard.size || '',
        type: billboard.type || '',
        isVisible: billboard.isVisible ?? true
      });
      
      // Show existing images
      if (billboard.images && billboard.images.length > 0) {
        setImagePreviews(billboard.images);
      } else if (billboard.imagePath) {
        setImagePreviews([billboard.imagePath]);
      }
    }
  }, [billboard]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
    
    setSelectedFiles(files);
    // Create preview URLs for new files
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('isVisible', formData.isVisible);

      // Add price if provided
      if (formData.price) {
        submitData.append('price', parseFloat(formData.price));
      }

      // Add size if provided
      if (formData.size) {
        submitData.append('size', formData.size);
      }

      // Add type if provided
      if (formData.type) {
        submitData.append('type', formData.type);
      }

      // Add location data
      if (formData.address) {
        const location = { address: formData.address };
        if (formData.latitude && formData.longitude) {
          location.lat = parseFloat(formData.latitude);
          location.lng = parseFloat(formData.longitude);
        }
        submitData.append('location', JSON.stringify(location));
      }

      // Only add new images if files were selected
      if (selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          submitData.append('images', file);
        });
      }

      await axios.put(`/api/admin/billboards/${billboard._id}`, submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      onSave();
    } catch (err) {
      console.error('Error updating billboard:', err);
      alert('Error updating billboard: ' + (err.response?.data?.error || err.message));
    }
  };

  useEffect(() => {
    // Cleanup blob URLs on unmount
    return () => {
      imagePreviews.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imagePreviews]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold text-blue-900">Edit Billboard</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Price (R/month)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              placeholder="e.g., 5000"
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Size</label>
            <input
              type="text"
              name="size"
              value={formData.size}
              onChange={handleChange}
              placeholder="e.g., 6m x 3m"
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <input
              type="text"
              name="type"
              value={formData.type}
              onChange={handleChange}
              placeholder="e.g., Digital, Static, LED"
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="e.g., R24 Highway, Johannesburg"
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700">Latitude (optional)</label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                step="any"
                placeholder="e.g., -26.338306"
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Longitude (optional)</label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                step="any"
                placeholder="e.g., 28.586667"
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="text-xs text-gray-500">
            💡 Add GPS coordinates for accurate map location
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Billboard Images</label>
            {imagePreviews.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-2">
                {imagePreviews.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Billboard ${index + 1}`}
                    className="w-full h-24 object-cover rounded border border-gray-200"
                  />
                ))}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">Upload new images to replace existing ones (max 5, up to 5MB each)</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isVisible"
              checked={formData.isVisible}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Visible to public
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
