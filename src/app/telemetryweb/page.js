"use client"
import { useState, useEffect } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Line } from "react-chartjs-2";
import styles from "../page.module.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Home() {
  const [rowCount, setRowCount] = useState(100);
  const [batteries, setBatteries] = useState([]);
  const [batLoading, setBatLoading] = useState(false);
  const [batError, setBatError] = useState("");
  const [stations, setStations] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sensors, setSensors] = useState([]);
  const [observations, setObservations] = useState([]);
  const [obsLoading, setObsLoading] = useState(false);
  const [obsError, setObsError] = useState("");

  // TODO: Replace with your actual API key
  const API_KEY = "VYMrSYGBPfpbA8CLxgijzSmrO_BUlKdrtQcMiIdK9h8";

  useEffect(() => {
    async function fetchStations() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("https://opmdata.gem.spc.int/telemetry/api/station", {
          headers: {
            "X-API-KEY": API_KEY,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch stations");
        const data = await res.json();
        setStations(data);
        if (data.length > 0) setSelected(data[0].id);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    async function fetchSensors() {
      try {
        const res = await fetch("https://opmdata.gem.spc.int/telemetry/api/sensors", {
          headers: {
            "X-API-KEY": API_KEY,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch sensors");
        const data = await res.json();
        setSensors(data);
      } catch (err) {
        // Optionally handle sensor error
      }
    }
    async function fetchBatteries() {
      setBatLoading(true);
      setBatError("");
      try {
        const res = await fetch("https://opmdata.gem.spc.int/telemetry/api/batteries", {
          headers: {
            "X-API-KEY": API_KEY,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch batteries");
        const data = await res.json();
        setBatteries(data);
      } catch (err) {
        setBatError(err.message);
      } finally {
        setBatLoading(false);
      }
    }
    fetchStations();
    fetchSensors();
    fetchBatteries();
  }, []);

  // Fetch observations when selected station or rowCount changes
  useEffect(() => {
    if (!selected) return;
    async function fetchObservations() {
      setObsLoading(true);
      setObsError("");
      try {
        // Find sensors for selected station
        const stationSensors = sensors.filter(s => s.station_id === selected);
        if (stationSensors.length === 0) {
          setObservations([]);
          setObsLoading(false);
          return;
        }
        // For demo, use first sensor
        const sensorId = stationSensors[0].id;
        const res = await fetch("https://opmdata.gem.spc.int/telemetry/api/observations", {
          headers: {
            "X-API-KEY": API_KEY,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch observations");
        const data = await res.json();
        // Filter observations for sensorId and only keep last N
        const sensorObservations = data.filter(o => o.sensor_id === sensorId);
        const lastN = sensorObservations.slice(-rowCount);
        setObservations(lastN);
      } catch (err) {
        setObsError(err.message);
      } finally {
        setObsLoading(false);
      }
    }
    fetchObservations();
  }, [selected, sensors, rowCount]);

  // Chart 1: timestamp vs reading for selected station's first sensor
  const chartData1 = {
    labels: observations.map(o => o.timestamp),
    datasets: [
      {
        label: "Sea Level",
        data: observations.map(o => Number(o.reading)),
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Chart 2: battery level vs timestamp for selected station
  let chartData2 = {
    labels: [],
    datasets: [
      {
        label: "Battery Level (V)",
        data: [],
        borderColor: "rgba(153,102,255,1)",
        backgroundColor: "rgba(153,102,255,0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Link batteries to observations and stations
  if (batteries.length > 0 && observations.length > 0 && selected) {
    // Get observation ids for selected station's sensor
    const stationSensors = sensors.filter(s => s.station_id === selected);
    const sensorIds = stationSensors.map(s => s.id);
    const obsIds = observations.filter(o => sensorIds.includes(o.sensor_id)).map(o => o.id);
    // Filter batteries for these observation ids
    const stationBatteries = batteries.filter(b => obsIds.includes(b.observation_id));
    // Only last N
    const lastNBat = stationBatteries.slice(-rowCount);
    chartData2 = {
      labels: lastNBat.map(b => b.timestamp),
      datasets: [
        {
          label: "Battery Level (V)",
          data: lastNBat.map(b => Number(b.battery_level)),
          borderColor: "rgba(153,102,255,1)",
          backgroundColor: "rgba(153,102,255,0.2)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }

  // Common chart options with dynamic sizing
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { position: "top" }, 
      title: { display: true, text: "Sensor 1" } 
    },
  };

  const batteryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { position: "top" }, 
      title: { display: true, text: "Sensor 2" } 
    },
  };

  return (
    <div className={styles.page}>
      <nav style={{ width: "100%", background: "#222", color: "#fff", padding: "1rem 2rem", position: "fixed", top: 0, left: 0, zIndex: 10 }}>
        <span style={{ fontWeight: "bold", fontSize: "1.5rem" }}>SPC Telemetry</span>
      </nav>
      <div style={{ 
        marginTop: "5rem", 
        width: "100%", 
        maxWidth: "1200px", // Increased from 800px to 1200px
        background: "#fff", 
        padding: "2rem", 
        borderRadius: 8, 
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)", 
        display: "flex", 
        flexDirection: "column", 
        gap: "2rem" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <label htmlFor="dropdown" style={{ fontWeight: "bold", marginRight: 8 }}>Select Station:</label>
          {loading ? (
            <span>Loading stations...</span>
          ) : error ? (
            <span style={{ color: "red" }}>{error}</span>
          ) : (
            <select
              id="dropdown"
              value={selected}
              onChange={e => setSelected(Number(e.target.value))}
              style={{ padding: "0.5rem 1rem", borderRadius: 4, border: "1px solid #ccc" }}
            >
              {stations.map(station => (
                <option key={station.id} value={station.id}>{station.display_name}</option>
              ))}
            </select>
          )}
          <label htmlFor="rowCount" style={{ fontWeight: "bold", marginLeft: 8 }}>Rows:</label>
          <input
            id="rowCount"
            type="number"
            min={1}
            max={1000}
            value={rowCount}
            onChange={e => setRowCount(Math.max(1, Math.min(1000, Number(e.target.value))))}
            style={{ width: 80, padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc" }}
          />
        </div>
        
        {/* Chart 1 Container */}
        <div style={{ height: "400px", width: "100%" }}>
          {obsLoading ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              Loading chart data...
            </div>
          ) : obsError ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "red" }}>
              {obsError}
            </div>
          ) : (
            <Line data={chartData1} options={chartOptions} />
          )}
        </div>

        {/* Chart 2 Container */}
        <div style={{ height: "400px", width: "100%" }}>
          {batLoading ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              Loading chart data...
            </div>
          ) : batError ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "red" }}>
              {batError}
            </div>
          ) : (
            <Line data={chartData2} options={batteryChartOptions} />
          )}
        </div>
      </div>
    </div>
  );
}