import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const BillboardModal = ({ billboard, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Handle multiple images - if only one image, use it in an array
  const images = billboard.images || (billboard.imagePath ? [billboard.imagePath] : []);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Determine map center and whether we have accurate coordinates
  const hasCoordinates = billboard.location?.lat && billboard.location?.lng;
  const mapCenter = hasCoordinates
    ? [billboard.location.lat, billboard.location.lng]
    : [-26.2041, 28.0473]; // Default Johannesburg center

  // Function to open map in external app
  const openInMaps = () => {
    const { lat, lng, address } = billboard.location;
    
    // Check if we have coordinates
    if (lat && lng) {
      // Try to detect iOS for Apple Maps, otherwise use Google Maps
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        // Apple Maps
        window.open(`maps://maps.apple.com/?q=${lat},${lng}&ll=${lat},${lng}`, '_blank');
      } else {
        // Google Maps
        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
      }
    } else if (address) {
      // Fallback to address search if no coordinates
      const encodedAddress = encodeURIComponent(address);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        window.open(`maps://maps.apple.com/?q=${encodedAddress}`, '_blank');
      } else {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white rounded-lg w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl h-5/6 flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-white rounded-full p-1.5 sm:p-2 hover:bg-gray-100 transition shadow-lg"
          aria-label="Close"
        >
          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Main Content */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          {/* Image Section with Carousel */}
          <div className="relative flex-grow bg-gray-100 flex items-center justify-center">
            {images.length > 0 ? (
              <>
                <img
                  src={images[currentImageIndex]}
                  alt={billboard.name}
                  className="max-w-full max-h-full object-contain"
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-3 transition shadow-lg"
                      aria-label="Previous image"
                    >
                      <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-3 transition shadow-lg"
                      aria-label="Next image"
                    >
                      <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-400">No image available</div>
            )}

            {/* Map View - Bottom Right Corner */}
            <div 
              className="absolute bottom-4 right-4 w-64 h-48 rounded-lg overflow-hidden shadow-lg border-2 border-white cursor-pointer group"
              onClick={openInMaps}
            >
              {/* Overlay hint on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all z-10 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg px-3 py-2 text-sm font-medium text-gray-900 shadow-lg">
                  <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in Maps
                </div>
              </div>

              {hasCoordinates ? (
                <MapContainer
                  center={mapCenter}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <Marker position={mapCenter}>
                    <Popup>{billboard.name}</Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="h-full w-full bg-gray-200 flex items-center justify-center p-4">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-xs text-gray-600">Click to search address</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Sidebar */}
          <div className="w-full md:w-72 lg:w-80 bg-white p-4 sm:p-6 overflow-y-auto border-t md:border-t-0 md:border-l border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-3 sm:mb-4">{billboard.name}</h2>
            
            {billboard.description && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
                <p className="text-gray-600">{billboard.description}</p>
              </div>
            )}

            {billboard.location?.address && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Location</h3>
                <p className="text-gray-600 flex items-start">
                  <svg className="w-5 h-5 text-blue-900 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {billboard.location.address}
                </p>
                {!hasCoordinates && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Exact map location not available
                  </p>
                )}
              </div>
            )}

            {billboard.size && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Size</h3>
                <p className="text-gray-600 flex items-center">
                  <svg className="w-5 h-5 text-blue-900 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  {billboard.size}
                </p>
              </div>
            )}

            {billboard.price && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Price</h3>
                <p className="text-2xl font-bold text-blue-900">R{billboard.price.toLocaleString()}<span className="text-sm text-gray-600">/month</span></p>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full mt-6 px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillboardModal;
