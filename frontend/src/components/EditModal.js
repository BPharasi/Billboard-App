import React, { useState, useEffect } from 'react';
import axios from 'axios';
// ...existing imports...

export default function EditModal({ billboard, onClose, refreshBillboards }) {
	// ...existing state for fields...
	const [selectedFile, setSelectedFile] = useState(null);
	const [imagePreview, setImagePreview] = useState(billboard?.imagePath || null);

	useEffect(() => {
		// if billboard.imagePath is remote URL (from server) we don't createObjectURL
		return () => {
			if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
		};
	}, [imagePreview]);

	const handleImageChange = (e) => {
		const file = e.target.files && e.target.files[0];
		if (!file) return;
		if (file.size >= 5 * 1024 * 1024) {
			alert('Image must be smaller than 5MB');
			return;
		}
		// revoke previous blob preview if any
		if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
		setSelectedFile(file);
		setImagePreview(URL.createObjectURL(file));
	};

	const handleUpdate = async (e) => {
		e.preventDefault();
		try {
			const formData = new FormData();
			// append fields to update
			formData.append('title', e.target.title.value);
			formData.append('description', e.target.description.value);
			if (selectedFile) {
				formData.append('image', selectedFile);
			}
			await axios.put(`/api/admin/billboards/${billboard._id}`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});
			if (typeof refreshBillboards === 'function') refreshBillboards();
			onClose();
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<div className="p-4">
			<form onSubmit={handleUpdate} className="space-y-4">
				{/* ...existing inputs prefilled with billboard data... */}
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
							<img
								src={imagePreview}
								alt="preview"
								className="w-full h-48 object-cover rounded-lg"
							/>
						</div>
					)}
				</div>

				<div className="flex justify-end space-x-2">
					<button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
					<button type="submit" className="px-4 py-2 bg-gold-500 text-white rounded">Save</button>
				</div>
			</form>
		</div>
	);
}
