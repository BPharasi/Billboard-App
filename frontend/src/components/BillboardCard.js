import React from 'react';

export default function BillboardCard({ billboard }) {
	const imgSrc = billboard?.imagePath || '/placeholder.jpg';

	return (
		<div className="bg-white shadow rounded-lg overflow-hidden">
			<img src={imgSrc} alt={billboard.title} className="w-full h-48 object-cover rounded-lg" />
			<div className="p-4">
				<h3 className="text-lg font-semibold">{billboard.title}</h3>
				<p className="text-sm text-gray-600 mt-1">{billboard.description}</p>
				{/* ...other UI/actions... */}
			</div>

			{/* Map popup / tooltip area (if used) */}
			{/* ...existing code for map popup ... */}
			{/* Example small map popup image: */}
			<div style={{ display: 'none' }}>
				{/* If used inside popup, render like below */}
				{/* <img src={billboard.imagePath || '/placeholder.jpg'} alt={billboard.title} style={{ width: '100px' }} /> */}
			</div>
		</div>
	);
}