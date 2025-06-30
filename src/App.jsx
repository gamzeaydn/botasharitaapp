import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";

import HaritaSayfasi from "./pages/HaritaSayfasi";
import KesintiRaporu from "./pages/KesintiRaporu";
import DususteRouterlar from "./pages/DususteRouterlar";

function App() {
  const [devices, setDevices] = useState([]);
  const [pingStatus, setPingStatus] = useState({});
  const [dususteRouterlar, setDususteRouterlar] = useState([]);
  const [yükleniyor, setYükleniyor] = useState(true);

  const veriGetir = async () => {
    setYükleniyor(true);
    try {
      const [deviceRes, pingRes] = await Promise.all([
        fetch("http://10.50.10.14:81/DeviceList"),
        fetch("http://10.50.10.14:81/PingList"),
      ]);

      const devicesData = await deviceRes.json();
      const pingsData = await pingRes.json();

      
      const pingStatusMap = {};
      pingsData.forEach(p => {
        pingStatusMap[p.pingID] = p.status.toLowerCase();
      });
      setPingStatus(pingStatusMap);

      setDevices(devicesData);

     
      const dususte = devicesData.filter(device => {
        if (!device.enlem || !device.boylam) return false;
        if (pingStatusMap[device.pingID] !== "down") return false;

        const lat = parseFloat(device.enlem.replace(",", "."));
        const lng = parseFloat(device.boylam.replace(",", "."));
        return !isNaN(lat) && !isNaN(lng);
      });

      setDususteRouterlar(dususte);
    } catch (error) {
      console.error("Veri çekme hatası:", error);
      setDevices([]);
      setPingStatus({});
      setDususteRouterlar([]);
    } finally {
      setYükleniyor(false);
    }
  };

  useEffect(() => {
    veriGetir();
    const interval = setInterval(veriGetir, 60000); // 60 saniyede bir yenile
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div>
        <nav style={{ padding: 10, background: "#f0f0f0" }}>
          <Link to="/" style={{ marginRight: 20 }}>Harita</Link>
          <Link to="/kesinti-raporu" style={{ marginRight: 20 }}>Kesinti Raporu</Link>
          <Link to="/dususte-olanlar" style={{ marginRight: 20 }}>Düşüşte Olanlar</Link>
        </nav>

        <Routes>
          <Route
            path="/"
            element={
              <HaritaSayfasi
                devices={devices}
                pingStatus={pingStatus}
              />
            }
          />
          <Route path="/kesinti-raporu" element={<KesintiRaporu />} />
          <Route
            path="/dususte-olanlar"
            element={
              <DususteRouterlar
                dususteRouterlar={dususteRouterlar}
                yükleniyor={yükleniyor}
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;



