import React from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';

const EditModal = ({ billboard, token, onSave, onClose }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: billboard || {
      name: '',
      location: { lat: '', lng: '', address: '' },
      size: '',
      price: '',
      imageUrl: '',
      isVisible: true,
      description: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      if (billboard) {
        await axios.put(`/api/admin/billboards/${billboard._id}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post('/api/admin/billboards', data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      onSave();
      reset();
    } catch (err) {
      alert('Error saving billboard: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-4 rounded max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">{billboard ? 'Edit Billboard' : 'Add New Billboard'}</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <input {...register('name', { required: true })} placeholder="Name" className="w-full p-2 mb-2 border" />
          {errors.name && <p className="text-red-500">Name is required</p>}
          <input {...register('location.lat', { required: true })} placeholder="Latitude" className="w-full p-2 mb-2 border" />
          <input {...register('location.lng', { required: true })} placeholder="Longitude" className="w-full p-2 mb-2 border" />
          <input {...register('location.address', { required: true })} placeholder="Address" className="w-full p-2 mb-2 border" />
          <input {...register('size', { required: true })} placeholder="Size" className="w-full p-2 mb-2 border" />
          <input {...register('price', { required: true, valueAsNumber: true })} placeholder="Price" type="number" className="w-full p-2 mb-2 border" />
          <input {...register('imageUrl', { required: true })} placeholder="Image URL" className="w-full p-2 mb-2 border" />
          <textarea {...register('description')} placeholder="Description" className="w-full p-2 mb-2 border"></textarea>
          <label className="flex items-center mb-4">
            <input {...register('isVisible')} type="checkbox" className="mr-2" />
            Visible
          </label>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="mr-2 p-2 bg-gray-500 text-white rounded">Cancel</button>
            <button type="submit" className="p-2 bg-gold-500 text-white rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
