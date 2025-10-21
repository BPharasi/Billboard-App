import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Custom billboard icon (optional, using default for simplicity)
const billboardIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149059.png', // Placeholder billboard icon URL
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25],
});

const MapView = ({ billboards }) => {
  return (
    <div className="mt-8">
      <MapContainer center={[-26.2041, 28.0473]} zoom={10} style={{ height: '400px' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {billboards.map(b => (
          <Marker key={b._id} position={[b.location.lat, b.location.lng]} icon={billboardIcon}>
            <Popup>
              <div>
                <h3 className="font-bold">{b.name}</h3>
                <p>{b.description}</p>
                <p className="text-gold-500 font-bold">R{b.price}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
