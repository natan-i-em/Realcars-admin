"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import * as XLSX from "xlsx";
import { 
  Search, Download, Eye, Trash2, X, Car as CarIcon, 
  Phone, User, Filter, ArrowUpDown, CheckCircle2, Circle
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

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    setCars(prev => prev.map(c => c._id === id ? { ...c, status: newStatus as any } : c));

    try {
      const response = await fetch(`/api/cars/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
    } catch (err) {
      setCars(prev => prev.map(c => c._id === id ? { ...c, status: currentStatus as any } : c));
      alert("Failed to save status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this vehicle permanently?")) return;
    try {
      const res = await fetch(`/api/cars/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCars(prev => prev.filter(c => c._id !== id));
        if (selectedCar?._id === id) setSelectedCar(null);
      }
    } catch (err) {
      alert("Delete failed.");
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
    XLSX.writeFile(wb, `Fleet_Report.xlsx`);
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
      return 0;
    });
  }, [cars, search, statusFilter, sortBy]);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#080808]">
      <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-slate-300 font-sans selection:bg-[#D4AF37] selection:text-black pb-10">
      
      {/* NAVBAR */}
      <nav className="border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D4AF37] rounded flex items-center justify-center text-black flex-shrink-0">
              <CarIcon size={18} />
            </div>
            <span className="font-bold text-white tracking-tight uppercase text-xs sm:text-sm">
              RealCars <span className="hidden sm:inline text-[#D4AF37] font-light">Management</span>
            </span>
          </div>
          <button onClick={exportToExcel} className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black border border-white/10 px-3 py-2 rounded-lg hover:bg-white/5 transition-all">
            <Download size={14} className="text-[#D4AF37]" /> <span className="hidden xs:block">EXPORT</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* STATS - Stacked on mobile, 3-col on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {[
            { label: "Total Units", val: cars.length, color: "text-white", ring: "border-white/5" },
            { label: "On Duty", val: cars.filter(c => c.status === "active").length, color: "text-green-500", ring: "ring-1 ring-green-500/20" },
            { label: "Available", val: cars.filter(c => c.status === "inactive").length, color: "text-[#D4AF37]", ring: "ring-1 ring-[#D4AF37]/20" }
          ].map((stat, i) => (
            <div key={i} className={`bg-[#0f0f0f] border border-white/5 p-5 sm:p-6 rounded-2xl ${stat.ring}`}>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.val}</h3>
            </div>
          ))}
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
            <input 
              type="text" 
              placeholder="Search fleet..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-[#D4AF37]/50 text-sm"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">On Duty</option>
              <option value="inactive">Available</option>
            </select>

            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest outline-none"
            >
              <option value="newest">Newest</option>
              <option value="owner-az">Owner A-Z</option>
            </select>
          </div>
        </div>

        {/* DATA VIEW */}
        <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] border-b border-white/5 text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-6">Owner & Vehicle</th>
                  <th className="px-8 py-6">Plate</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {processedCars.map((car) => (
                  <tr key={car._id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-black rounded-lg overflow-hidden relative border border-white/10 flex-shrink-0">
                          {car.carPhotos?.[0] ? <Image src={car.carPhotos[0]} alt="" fill className="object-cover" /> : <CarIcon size={14} className="m-auto absolute inset-0 text-gray-800" />}
                        </div>
                        <div className="truncate">
                          <div className="text-white font-bold text-sm truncate max-w-[150px]">{car.fullName}</div>
                          <div className="text-[10px] text-gray-500 uppercase truncate">{car.carModel}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-mono text-[10px] text-[#D4AF37] border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-2 py-1 rounded tracking-widest">
                        {car.plateNumber}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <button onClick={() => toggleStatus(car._id, car.status)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase transition-all ${car.status === 'active' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                        {car.status === 'active' ? <CheckCircle2 size={10} /> : <Circle size={10} />} {car.status === 'active' ? 'On Duty' : 'Available'}
                      </button>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setSelectedCar(car); setActiveImage(0); }} className="p-2.5 bg-white/5 hover:bg-[#D4AF37] hover:text-black rounded-lg transition-all text-gray-400"><Eye size={16}/></button>
                        <button onClick={() => handleDelete(car._id)} className="p-2.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all text-gray-600"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile List View (Cards) */}
          <div className="md:hidden divide-y divide-white/5">
            {processedCars.map((car) => (
              <div key={car._id} className="p-4 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-black rounded-xl overflow-hidden relative border border-white/10 flex-shrink-0">
                    {car.carPhotos?.[0] ? <Image src={car.carPhotos[0]} alt="" fill className="object-cover" /> : <CarIcon size={16} className="m-auto absolute inset-0 text-gray-800" />}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="text-white font-bold text-sm truncate">{car.fullName}</div>
                    <div className="text-[10px] text-gray-500 uppercase">{car.carModel} • {car.carYear}</div>
                  </div>
                  <span className="font-mono text-[10px] text-[#D4AF37] bg-[#D4AF37]/5 px-2 py-1 rounded border border-[#D4AF37]/20 uppercase">
                    {car.plateNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <button onClick={() => toggleStatus(car._id, car.status)} className={`flex-grow flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[10px] font-black uppercase transition-all ${car.status === 'active' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                    {car.status === 'active' ? <CheckCircle2 size={12} /> : <Circle size={12} />} {car.status === 'active' ? 'On Duty' : 'Available'}
                  </button>
                  <button onClick={() => { setSelectedCar(car); setActiveImage(0); }} className="p-3 bg-white/5 rounded-xl text-gray-400 border border-white/10"><Eye size={18}/></button>
                  <button onClick={() => handleDelete(car._id)} className="p-3 bg-red-500/5 rounded-xl text-red-900 border border-red-900/10"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* MOBILE FRIENDLY MODAL */}
      {selectedCar && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-[#0f0f0f] border-t sm:border border-white/10 w-full max-w-5xl rounded-t-[2rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row max-h-[95vh] sm:max-h-[90vh]">
            
            {/* Image Section */}
            <div className="w-full md:w-1/2 bg-black relative aspect-square sm:aspect-auto sm:min-h-[400px]">
              <Image src={selectedCar.carPhotos?.[activeImage] || ""} alt="" fill className="object-cover" />
              <button onClick={() => setSelectedCar(null)} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white sm:hidden"><X size={20}/></button>
              <div className="absolute bottom-4 left-4 flex gap-2 overflow-x-auto pb-2 max-w-[90%] scrollbar-hide">
                {selectedCar.carPhotos?.map((p, i) => (
                  <button key={i} onClick={() => setActiveImage(i)} className={`w-12 h-12 flex-shrink-0 rounded-lg border-2 transition-all overflow-hidden ${activeImage === i ? 'border-[#D4AF37]' : 'border-transparent opacity-50'}`}>
                    <Image src={p} alt="" width={48} height={48} className="object-cover h-full" />
                  </button>
                ))}
              </div>
            </div>

            {/* Content Section */}
            <div className="w-full md:w-1/2 p-6 sm:p-14 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-start mb-6 sm:mb-10">
                <div>
                  <p className="text-[9px] text-[#D4AF37] font-black uppercase tracking-[0.3em] mb-1">Fleet Detail</p>
                  <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tighter">{selectedCar.carModel}</h2>
                </div>
                <button onClick={() => setSelectedCar(null)} className="hidden sm:block p-3 bg-white/5 rounded-full text-gray-500 hover:text-white"><X size={24}/></button>
              </div>

              <div className="space-y-6 flex-grow">
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[8px] uppercase font-bold text-gray-600 tracking-widest mb-1">Owner</p>
                    <div className="flex items-center gap-2 text-white text-sm font-bold"><User size={14} className="text-[#D4AF37]"/> {selectedCar.fullName}</div>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase font-bold text-gray-600 tracking-widest mb-1">Plate</p>
                    <div className="text-white text-sm font-mono tracking-widest">{selectedCar.plateNumber}</div>
                  </div>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <p className="text-[8px] uppercase font-bold text-gray-600 tracking-widest mb-2">Rental Terms</p>
                  <p className="text-white text-xs font-bold">{selectedCar.maxRentDays} Days ({selectedCar.rentType})</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col xs:flex-row gap-3">
                <a href={`tel:${selectedCar.phone}`} className="flex-1 bg-[#D4AF37] text-black text-[10px] font-black uppercase py-4 rounded-xl flex items-center justify-center gap-2">
                  <Phone size={14} /> CALL OWNER
                </a>
                <button onClick={() => setSelectedCar(null)} className="flex-1 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase py-4 rounded-xl">
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}