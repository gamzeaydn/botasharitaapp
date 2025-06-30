import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function Harita({ devices, pingStatus }) {
  return (
    <MapContainer
      center={[39.9255, 32.8664]}
      zoom={6}
      style={{ height: "70vh", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {devices
        .filter(device => {
          if (!device.enlem || !device.boylam) return false;
          const lat = parseFloat(device.enlem.replace(",", "."));
          const lng = parseFloat(device.boylam.replace(",", "."));
          return !isNaN(lat) && !isNaN(lng);
        })
        .map(device => {
          const id = device.pingID || device.id;
          const lat = parseFloat(device.enlem.replace(",", "."));
          const lng = parseFloat(device.boylam.replace(",", "."));
          const durum = pingStatus[id] || "up";
          const icon = durum === "up" ? greenIcon : redIcon;

          return (
            <Marker key={id} position={[lat, lng]} icon={icon}>
              <Popup>
                <strong>{device.cihazAdi}</strong>
                <br />
                Tür: {device.cihazTuru}
                <br />
                IP: {device.ip}
                <br />
                Durum: {durum === "up" ? "Up" : "Down"}
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}

