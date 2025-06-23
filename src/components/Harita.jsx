import React, { useEffect, useState, useRef } from "react";
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

export default function Harita() {
  const [devices, setDevices] = useState([]);
  const [pingStatus, setPingStatus] = useState({});
  const kesintiRaporu = useRef({});

  // CSV indirme fonksiyonu
  function indirCSV() {
    let csv =
      "Cihaz Adı,IP,Durum,Kesinti Sayısı,Toplam Kesinti Süresi (sn)\n";

    devices
      .filter((d) => d.cihazTuru.toLowerCase() === "router")
      .forEach((device) => {
        const id = device.pingID || device.id;
        const rapor = kesintiRaporu.current[id] || {
          kesintiSayisi: 0,
          toplamKesintiSuresi: 0,
          durum: pingStatus[id] || "Up",
        };

        csv += `${device.cihazAdi},${device.ip},${rapor.durum},${rapor.kesintiSayisi},${Math.floor(
          rapor.toplamKesintiSuresi / 1000
        )}\n`;
      });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "kesinti_raporu.csv";
    link.click();
  }

  // Cihaz listesini çek
  useEffect(() => {
    fetch("http://10.50.10.14:81/DeviceList")
      .then((res) => res.json())
      .then((data) => setDevices(data))
      .catch((e) => console.error("DeviceList fetch error:", e));
  }, []);

  // Ping durumlarını çek ve raporu güncelle
  useEffect(() => {
    function fetchPingList() {
      fetch("http://10.50.10.14:81/PingList")
        .then((res) => res.json())
        .then((data) => {
          const yeniStatus = { ...pingStatus };

          data.forEach((item) => {
            const id = item.pingID;
            const status = item.status.toLowerCase(); // küçük harfe çevir
            const onceki = kesintiRaporu.current[id]?.durum?.toLowerCase() || "up";

            if (!kesintiRaporu.current[id]) {
              kesintiRaporu.current[id] = {
                kesintiSayisi: 0,
                kesintiBaslangic: null,
                toplamKesintiSuresi: 0,
                durum: status,
              };
            }

            if (onceki !== status) {
              if (status === "down") {
                kesintiRaporu.current[id].kesintiSayisi += 1;
                kesintiRaporu.current[id].kesintiBaslangic = Date.now();
              }

              if (status === "up" && kesintiRaporu.current[id].kesintiBaslangic) {
                const fark = Date.now() - kesintiRaporu.current[id].kesintiBaslangic;
                kesintiRaporu.current[id].toplamKesintiSuresi += fark;
                kesintiRaporu.current[id].kesintiBaslangic = null;
              }

              kesintiRaporu.current[id].durum = status;
            }

            yeniStatus[id] = status;
          });

          setPingStatus(yeniStatus);
        })
        .catch((e) => console.error("PingList fetch error:", e));
    }

    fetchPingList();
    const intervalId = setInterval(fetchPingList, 300000); // 5 dakika

    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      {/* Harita */}
      <MapContainer
        center={[39.9255, 32.8664]}
        zoom={6}
        style={{ height: "70vh", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {devices
          .filter((device) => device.cihazTuru.toLowerCase() === "router")
          .map((device) => {
            const id = device.pingID || device.id;
            const lat = parseFloat(device.enlem?.replace(",", "."));
            const lng = parseFloat(device.boylam?.replace(",", "."));
            if (isNaN(lat) || isNaN(lng)) return null;

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

      {/* Rapor ve CSV İndir Butonu */}
      <div style={{ padding: "1rem", backgroundColor: "#f8f8f8" }}>
        <h3>Router Kesinti Raporları</h3>

        <button
          onClick={indirCSV}
          style={{ padding: "8px 16px", fontWeight: "bold", marginBottom: "1rem" }}
        >
          CSV Olarak İndir
        </button>

        <table
          border="1"
          cellPadding="5"
          cellSpacing="0"
          style={{ width: "100%", background: "white" }}
        >
          <thead>
            <tr>
              <th>Cihaz Adı</th>
              <th>IP</th>
              <th>Durum</th>
              <th>Kesinti Sayısı</th>
              <th>Toplam Kesinti Süresi (sn)</th>
            </tr>
          </thead>
          <tbody>
            {devices
              .filter((device) => device.cihazTuru.toLowerCase() === "router")
              .map((device) => {
                const id = device.pingID || device.id;
                const rapor = kesintiRaporu.current[id] || {
                  kesintiSayisi: 0,
                  toplamKesintiSuresi: 0,
                  durum: pingStatus[id] || "up",
                };

                return (
                  <tr key={id}>
                    <td>{device.cihazAdi}</td>
                    <td>{device.ip}</td>
                    <td>{rapor.durum === "up" ? "Up" : "Down"}</td>
                    <td>{rapor.kesintiSayisi}</td>
                    <td>{Math.floor(rapor.toplamKesintiSuresi / 1000)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </>
  );
}

