import React, { useCallback } from 'react';

export default function ImagePreview({
	selectedFile,
	setSelectedFile,
	imagePreview,
	setImagePreview,
	maxSize = 5 * 1024 * 1024,
	label = 'Upload Billboard Image',
	accept = 'image/*',
}) {
	const handleFile = useCallback(
		(file) => {
			if (!file) return;
			if (file.size >= maxSize) {
				// use your toast or alert
				alert('Upload failed: file too large (max 5MB)');
				return;
			}
			if (imagePreview && imagePreview.startsWith('blob:')) {
				URL.revokeObjectURL(imagePreview);
			}
			setSelectedFile(file);
			setImagePreview(URL.createObjectURL(file));
		},
		[imagePreview, maxSize, setImagePreview, setSelectedFile]
	);

	const onChange = (e) => {
		const file = e.target.files && e.target.files[0];
		handleFile(file);
	};

	const onDrop = (e) => {
		e.preventDefault();
		const file = e.dataTransfer?.files && e.dataTransfer.files[0];
		handleFile(file);
	};

	const onDragOver = (e) => {
		e.preventDefault();
	};

	const removeFile = () => {
		if (imagePreview && imagePreview.startsWith('blob:')) {
			URL.revokeObjectURL(imagePreview);
		}
		setSelectedFile(null);
		setImagePreview(null);
	};

	return (
		<div>
			<label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
			<div
				onDrop={onDrop}
				onDragOver={onDragOver}
				className="w-full border-2 border-dashed p-4 rounded-lg focus:ring-gold-500 cursor-pointer"
			>
				<input
					type="file"
					accept={accept}
					onChange={onChange}
					className="w-full opacity-0 absolute inset-0 h-full cursor-pointer"
				/>
				<div className="text-center pointer-events-none">
					<p className="text-sm text-gray-500">Drag & drop an image here, or click to select</p>
				</div>
			</div>

			{imagePreview && (
				<div className="mt-3 relative">
					<img src={imagePreview} alt="preview" className="w-full h-48 object-cover rounded-lg" />
					<button
						type="button"
						onClick={removeFile}
						className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-1"
						aria-label="Remove image"
					>
						✕
					</button>
				</div>
			)}
		</div>
	);
}
