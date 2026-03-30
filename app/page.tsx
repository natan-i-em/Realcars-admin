"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface Car {
  _id: string;
  plateNumber: string;
  fullName: string;
  phone: string;
  carModel: string;
  carYear: number;
  carPhotos?: string[];
}

export default function AdminDashboard() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  const fetchCars = async () => {
    try {
      const res = await fetch("/api/cars");
      const data = await res.json();
      setCars(data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCars();
    const interval = setInterval(fetchCars, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredCars = cars.filter((car) => {
    const s = search.toLowerCase();
    return (
      car.fullName?.toLowerCase().includes(s) ||
      car.carModel?.toLowerCase().includes(s) ||
      car.plateNumber?.toLowerCase().includes(s) ||
      car.phone?.toLowerCase().includes(s)
    );
  });

  const deleteCar = async (plate: string) => {
    if (!confirm(`Delete car ${plate}?`)) return;
    await fetch(`/api/cars/${plate}`, { method: "DELETE" });
    fetchCars();
  };

  const exportToExcel = () => {
    const dataToExport = filteredCars.map(({ fullName, phone, plateNumber, carModel, carYear }) => ({
      fullName, phone, plateNumber, carModel, carYear,
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cars");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "cars.xlsx");
  };

  const colors = {
    gold: "#D4AF37",
    black: "#0D0D0D",
    cardBg: "#141414",
    textLight: "#FFFFFF",
    border: "#2A2A2A"
  };

  if (loading) return (
    <div style={{ backgroundColor: colors.black, height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: colors.gold }}>
      <h2 style={{ letterSpacing: "4px", textTransform: "uppercase" }}>Initializing Garage...</h2>
    </div>
  );

  return (
    <div style={{ 
      backgroundColor: colors.black, 
      minHeight: "100vh", 
      padding: "20px", 
      color: colors.textLight, 
      fontFamily: "'Inter', sans-serif",
      backgroundImage: 'radial-gradient(circle at top right, #1a1a1a, #0d0d0d)'
    }}>
      <style jsx>{`
        @media (max-width: 768px) {
          thead { display: none; }
          tr { display: block; margin-bottom: 20px; border: 1px solid #D4AF37 !important; border-radius: 8px; background: #1A1A1A; }
          td { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px !important; border-bottom: 1px solid #222; text-align: right; }
          td::before { content: attr(data-label); font-weight: bold; color: #D4AF37; text-transform: uppercase; font-size: 0.7rem; float: left; }
          .header-flex { flex-direction: column; align-items: flex-start !important; gap: 15px; }
        }
      `}</style>
      
      {/* Header Section */}
      <div className="header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: `2px solid ${colors.gold}`, paddingBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: "clamp(1.2rem, 5vw, 2.2rem)", fontWeight: "900", textTransform: "uppercase", letterSpacing: "-1px" }}>
          REAL CARS <span style={{ color: colors.gold }}>RENT DASHBOARD</span>
        </h1>
        <button onClick={exportToExcel} style={exportBtnStyle(colors)}>Export Fleet (Excel)</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "25px" }}>
        <input
          type="text"
          placeholder="SEARCH BY PLATE, MODEL, OR OWNER..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ 
            padding: "15px", width: "100%", maxWidth: "500px", 
            backgroundColor: colors.cardBg, border: `1px solid ${colors.gold}`, 
            color: "#fff", borderRadius: "4px", outline: "none", letterSpacing: "1px"
          }}
        />
      </div>

      {/* Table Section */}
      <div style={{ backgroundColor: colors.cardBg, borderRadius: "12px", overflow: "hidden", border: `1px solid ${colors.border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: colors.gold, color: colors.black }}>
              <th style={thStyle}>Plate</th>
              <th style={thStyle}>Owner / Contact</th>
              <th style={thStyle}>Vehicle</th>
              <th style={thStyle}>Photos</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCars.map((car) => (
              <tr key={car._id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={tdStyle} data-label="Plate">
                  <span style={{ color: colors.gold, fontWeight: "bold", fontSize: "1.1rem" }}>{car.plateNumber}</span>
                </td>
                <td style={tdStyle} data-label="Owner">
                  <div style={{ fontWeight: "600" }}>{car.fullName}</div>
                  <div style={{ fontSize: "0.8rem", color: "#888" }}>{car.phone}</div>
                </td>
                <td style={tdStyle} data-label="Vehicle">
                  <div style={{ fontWeight: "bold", textTransform: "uppercase" }}>{car.carModel}</div>
                  <div style={{ fontSize: "0.8rem", color: colors.gold }}>{car.carYear}</div>
                </td>
                <td style={tdStyle} data-label="Photos">
                  {car.carPhotos && car.carPhotos.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Image src={car.carPhotos[0]} alt="car" width={60} height={40} style={{ borderRadius: "4px", objectFit: 'cover', border: '1px solid #444' }} />
                      {car.carPhotos.length > 1 && <span style={{ fontSize: '0.7rem', color: colors.gold }}>+{car.carPhotos.length - 1}</span>}
                    </div>
                  ) : "—"}
                </td>
                <td style={tdStyle} data-label="Action">
                  <button onClick={() => setSelectedCar(car)} style={actionBtnStyle(colors.gold, false)}>VIEW</button>
                  <button onClick={() => deleteCar(car.plateNumber)} style={{ ...actionBtnStyle("#ff4d4d", true), marginLeft: "8px" }}>DELETE</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ENHANCED VIEW MODAL (LARGER & MODERN) */}
      {selectedCar && (
        <div style={modalOverlayStyle} onClick={() => setSelectedCar(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${colors.gold}`, paddingBottom: '15px', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, textTransform: "uppercase", fontSize: "1.8rem", fontWeight: "900" }}>
                {selectedCar.carModel} <span style={{ color: colors.gold, fontSize: '1.2rem', fontWeight: '400' }}>({selectedCar.carYear})</span>
              </h2>
              <button 
                onClick={() => setSelectedCar(null)} 
                style={{ background: 'none', border: `1px solid ${colors.gold}`, color: colors.gold, padding: '5px 12px', cursor: 'pointer', borderRadius: '4px' }}
              >✕ CLOSE</button>
            </div>
            
            {/* Modal Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px', marginBottom: '30px' }}>
              <div style={infoBlock}>
                <p style={labelStyle}>IDENTIFICATION / PLATE</p>
                <p style={valStyle}>{selectedCar.plateNumber}</p>
              </div>
              <div style={infoBlock}>
                <p style={labelStyle}>OWNER NAME</p>
                <p style={valStyle}>{selectedCar.fullName}</p>
              </div>
              <div style={infoBlock}>
                <p style={labelStyle}>CONTACT NUMBER</p>
                <p style={valStyle}>{selectedCar.phone}</p>
              </div>
            </div>

            {/* Photo Showroom Section */}
            <p style={{ ...labelStyle, marginBottom: '15px' }}>VEHICLE SHOWROOM</p>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", 
              gap: "15px", 
              maxHeight: '450px', 
              overflowY: 'auto', 
              padding: '15px', 
              backgroundColor: '#000', 
              borderRadius: '8px',
              border: '1px solid #222'
            }}>
              {selectedCar.carPhotos && selectedCar.carPhotos.length > 0 ? (
                selectedCar.carPhotos.map((photo, i) => (
                  <div key={i} style={{ position: 'relative', height: '160px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #333' }}>
                    <Image src={photo} alt="car" fill style={{ objectFit: "cover" }} />
                  </div>
                ))
              ) : (
                <p style={{ color: '#444' }}>No images available for this vehicle.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const thStyle: React.CSSProperties = { padding: "18px 15px", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: '1px' };
const tdStyle: React.CSSProperties = { padding: "18px 15px" };
const labelStyle = { fontSize: '0.7rem', color: '#D4AF37', margin: '0 0 8px 0', letterSpacing: '2px', fontWeight: 'bold' };
const valStyle = { fontSize: '1.3rem', fontWeight: '900', margin: '0', color: '#FFF' };
const infoBlock = { borderLeft: '3px solid #D4AF37', paddingLeft: '15px' };

const exportBtnStyle = (colors: any) => ({
  backgroundColor: colors.gold, color: "#000", border: "none",
  padding: "12px 24px", fontWeight: "900", borderRadius: "4px", fontSize: "0.8rem", cursor: 'pointer', textTransform: 'uppercase' as const
});

const actionBtnStyle = (color: string, isDelete: boolean) => ({
  backgroundColor: isDelete ? "transparent" : color,
  color: isDelete ? color : "#000",
  border: `1px solid ${color}`,
  padding: "8px 16px",
  borderRadius: "4px",
  fontSize: "0.7rem",
  fontWeight: "bold" as const,
  cursor: 'pointer',
  transition: '0.2s'
});

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
  backgroundColor: "rgba(0,0,0,0.92)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: '20px'
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: "#111", padding: "40px", borderRadius: "8px",
  width: "100%", maxWidth: "1000px", // Increased width
  border: "1px solid #D4AF37", 
  boxShadow: "0 0 50px rgba(212, 175, 55, 0.15)",
  maxHeight: '90vh',
  overflowY: 'auto'
};