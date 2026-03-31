"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import * as XLSX from "xlsx";
import { 
  Search, Download, Eye, Trash2, X, Car as CarIcon, 
  Calendar, Phone, User, Filter, ArrowUpDown, CheckCircle2, Circle
} from "lucide-react";

interface Car {
  _id: string;
  plateNumber: string;
  fullName: string;
  phone: string;
  carModel: string;
  carYear: number;
  carPhotos?: string[];
  maxRentDays: string;
  rentType: string;
  createdAt: Date;
  status: "active" | "inactive"; 
}

export default function AdminDashboard() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  const fetchCars = async () => {
    try {
      const res = await fetch("/api/cars");
      const data = await res.json();
      const sanitized = data.map((c: Car) => ({ ...c, status: c.status || "inactive" }));
      setCars(sanitized || []);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  // --- PERSISTENT STATUS TOGGLE (PATCH) ---
  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    
    // Optimistic UI Update
    setCars(prev => prev.map(c => c._id === id ? { ...c, status: newStatus as any } : c));

    try {
      const response = await fetch(`/api/cars/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");
    } catch (err) {
      console.error("DB Update Error:", err);
      // Rollback on error
      setCars(prev => prev.map(c => c._id === id ? { ...c, status: currentStatus as any } : c));
      alert("Failed to save status to database.");
    }
  };

  // --- DELETE VEHICLE (DELETE) ---
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this vehicle from the fleet permanently?")) return;

    try {
      const res = await fetch(`/api/cars/${id}`, { method: "DELETE" });

      if (res.ok) {
        setCars(prev => prev.filter(c => c._id !== id));
        if (selectedCar?._id === id) setSelectedCar(null);
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      console.error(err);
      alert("Could not delete vehicle.");
    }
  };

  const exportToExcel = () => {
    const dataToExport = processedCars.map((car) => ({
      Owner: car.fullName,
      Phone: car.phone,
      Model: car.carModel,
      Plate: car.plateNumber,
      Status: car.status === "active" ? "On Duty" : "Available",
      Registered: new Date(car.createdAt).toLocaleDateString(),
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fleet_Data");
    XLSX.writeFile(wb, `Fleet_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const processedCars = useMemo(() => {
    let result = cars.filter((car) => {
      const matchesSearch = 
        car.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        car.carModel?.toLowerCase().includes(search.toLowerCase()) ||
        car.plateNumber?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = statusFilter === "all" || car.status === statusFilter;
      return matchesSearch && matchesFilter;
    });

    return result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "owner-az") return a.fullName.localeCompare(b.fullName); 
      if (sortBy === "status") return (a.status || "").localeCompare(b.status || "");
      return 0;
    });
  }, [cars, search, statusFilter, sortBy]);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#080808]">
      <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-slate-300 font-sans selection:bg-[#D4AF37] selection:text-black">
      
      {/* HEADER */}
      <nav className="border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D4AF37] rounded flex items-center justify-center text-black">
              <CarIcon size={18} />
            </div>
            <span className="font-bold text-white tracking-tight uppercase text-sm">RealCars <span className="text-[#D4AF37] font-light">Management</span></span>
          </div>
          <button onClick={exportToExcel} className="flex items-center gap-2 text-[10px] font-black border border-white/10 px-4 py-2 rounded-lg hover:bg-white/5 transition-all">
            <Download size={14} className="text-[#D4AF37]" /> EXPORT FLEET
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#0f0f0f] border border-white/5 p-6 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">Total Units</p>
            <h3 className="text-3xl font-bold text-white">{cars.length}</h3>
          </div>
          <div className="bg-[#0f0f0f] border border-white/5 p-6 rounded-2xl ring-1 ring-green-500/20">
            <p className="text-[10px] font-bold text-green-500 uppercase tracking-[0.2em] mb-2">Current On Duty</p>
            <h3 className="text-3xl font-bold text-white">{cars.filter(c => c.status === "active").length}</h3>
          </div>
          <div className="bg-[#0f0f0f] border border-white/5 p-6 rounded-2xl ring-1 ring-[#D4AF37]/20">
            <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.2em] mb-2">Available for Job</p>
            <h3 className="text-3xl font-bold text-white">{cars.filter(c => c.status === "inactive").length}</h3>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
            <input 
              type="text" 
              placeholder="Search by owner, model or plate..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#D4AF37]/50 text-sm"
            />
          </div>
          
          <div className="flex gap-3">
            <div className="flex items-center bg-[#0f0f0f] border border-white/10 rounded-2xl px-4">
              <Filter size={14} className="text-gray-500 mr-2" />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-[10px] font-bold py-4 outline-none text-gray-400 uppercase tracking-widest cursor-pointer"
              >
                <option value="all">All Units</option>
                <option value="active">On Duty</option>
                <option value="inactive">Available</option>
              </select>
            </div>

            <div className="flex items-center bg-[#0f0f0f] border border-white/10 rounded-2xl px-4">
              <ArrowUpDown size={14} className="text-gray-500 mr-2" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-[10px] font-bold py-4 outline-none text-gray-400 uppercase tracking-widest cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="owner-az">Owner A-Z</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* LIST TABLE */}
        <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] border-b border-white/5 text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em]">
              <tr>
                <th className="px-8 py-6">Owner & Vehicle</th>
                <th className="px-8 py-6">Plate Number</th>
                <th className="px-8 py-6">Current Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processedCars.map((car) => (
                <tr key={car._id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-black rounded-xl overflow-hidden relative border border-white/10">
                        {car.carPhotos?.[0] ? <Image src={car.carPhotos[0]} alt="" fill className="object-cover" /> : <CarIcon size={16} className="m-auto absolute inset-0 text-gray-800" />}
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm tracking-tight">{car.fullName}</div>
                        <div className="text-[10px] text-gray-500 uppercase">{car.carModel} • {car.carYear}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-mono text-xs text-[#D4AF37] border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-1 rounded-md tracking-widest uppercase">
                      {car.plateNumber}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => toggleStatus(car._id, car.status)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                        car.status === 'active' 
                        ? 'bg-green-500/10 border-green-500/30 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                        : 'bg-white/5 border-white/10 text-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {car.status === 'active' ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                      <span className="text-[10px] font-black uppercase tracking-tighter">
                        {car.status === 'active' ? 'On Duty' : 'Available'}
                      </span>
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setSelectedCar(car); setActiveImage(0); }} className="p-3 bg-white/5 hover:bg-[#D4AF37] hover:text-black rounded-xl transition-all text-gray-400">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleDelete(car._id)} className="p-3 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all text-gray-600">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* BIGGER VIEW MODAL */}
      {selectedCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0f0f0f] border border-white/10 w-full max-w-5xl rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row max-h-[90vh] shadow-[0_0_80px_rgba(0,0,0,1)]">
            
            <div className="w-full md:w-1/2 bg-black relative min-h-[400px]">
              <Image src={selectedCar.carPhotos?.[activeImage] || ""} alt="" fill className="object-cover" />
              <div className="absolute bottom-8 left-8 flex gap-2">
                {selectedCar.carPhotos?.map((p, i) => (
                  <button key={i} onClick={() => setActiveImage(i)} className={`w-14 h-14 rounded-xl border-2 transition-all overflow-hidden ${activeImage === i ? 'border-[#D4AF37] scale-110' : 'border-transparent opacity-50'}`}>
                    <Image src={p} alt="" width={56} height={56} className="object-cover h-full" />
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-[0.4em] mb-2">Fleet Detail</p>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-tight">{selectedCar.carModel}</h2>
                  <div className="flex gap-4 mt-3">
                    <span className="text-xs text-gray-500 font-mono tracking-widest">{selectedCar.plateNumber}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500 font-bold uppercase">{selectedCar.carYear} Edition</span>
                  </div>
                </div>
                <button onClick={() => setSelectedCar(null)} className="p-3 bg-white/5 rounded-full text-gray-500 hover:text-white transition-all"><X size={24}/></button>
              </div>

              <div className="grid grid-cols-2 gap-y-10 gap-x-8 text-sm flex-grow">
                <div>
                  <p className="text-[9px] uppercase font-bold text-gray-600 tracking-widest mb-2">Owner Identity</p>
                  <div className="flex items-center gap-3 text-white text-lg font-bold"><User size={18} className="text-[#D4AF37]"/> {selectedCar.fullName}</div>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-gray-600 tracking-widest mb-2">Phone Lines</p>
                  <div className="flex items-center gap-3 text-white text-lg font-mono"><Phone size={18} className="text-[#D4AF37]"/> {selectedCar.phone}</div>
                </div>
                <div className="col-span-2 p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-gray-600 tracking-widest mb-1">Contract Status</p>
                      <p className="text-white font-bold">{selectedCar.maxRentDays} Days Max ({selectedCar.rentType})</p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl font-black text-[10px] tracking-widest ${selectedCar.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-800 text-gray-400'}`}>
                      {selectedCar.status === 'active' ? 'ON DUTY' : 'AVAILABLE'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex gap-4">
                <a 
                  href={`tel:${selectedCar.phone}`}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#b8962d] text-black text-xs font-black uppercase py-5 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-[#D4AF37]/10"
                >
                  <Phone size={16} /> CONTACT OWNER
                </a>
                <button onClick={() => setSelectedCar(null)} className="px-8 bg-white/5 border border-white/10 text-white text-xs font-black uppercase rounded-2xl hover:bg-white/10 transition-all">
                  EXIT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}