import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, Users, School, Building2, ArrowLeft } from "lucide-react";
import logoBrand from "../assets/skoolago_typograph_brand.png";

export default function PortalSelectionPage() {
  const portals = [
    {
      id: "guru",
      title: "Portal Guru",
      role: "Pembelajaran",
      description: "Kelola kelas, akademik, siswa dan bank soal ujian.",
      icon: GraduationCap,
      path: "/login/guru",
    },
    {
      id: "siswa",
      title: "Portal Kepala Sekolah",
      role: "Supervisi Eksekutif",
      description: "Informasi kehadiran guru siswa dan staf",
      icon: Users,
      path: "#", // path login siswa
      disabled: true,
    },
    {
      id: "admin",
      title: "Admin Sekolah",
      role: "Operasional Sekolah",
      description: "Kelola akun, kesiswaan, kelas, mapel, jadwal pelajaran dan soal ujian",
      icon: School,
      path: "/login/admin-sekolah",
    },
    {
      id: "yayasan",
      title: "Portal Yayasan",
      role: "Kendali Multi Sekolah",
      description: "Sekolah, kepegawaian, sarpras dan persetujuan.",
      icon: Building2,
      path: "#", 
      disabled: true,
    },
  ];

  return (
    <div 
        className="min-h-screen relative"
        style={{ 
            background: 'linear-gradient(to bottom, #e6f7ec 0%, #ffffff 100%)' 
        }}
    >
      {/* Background Pattern Grid */}
      {/* <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
        style={{ 
          backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} 
      /> */}
      {/* Tombol Back ke Landing Page */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-emerald-600 transition">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
      </div>

      {/* Header Section */}
      <div className="relative z-10 mx-auto max-w-3xl px-4 pt-12 pb-10 text-center sm:px-6">
        <img src={logoBrand} alt="SkoolaGo" className="mx-auto h-12 w-auto object-contain mb-6" />
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Selamat Datang di <span className="text-emerald-600">Portal Pendidikan</span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-gray-500 sm:text-base">
          Pilih portal login sesuai dengan role anda.
        </p>
      </div>

      {/* Main Card Container */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pilih portal Anda</h2>
              <p className="mt-1 text-sm text-gray-500">Setiap portal memiliki menu yang berbeda sesuai kebutuhan pengguna.</p>
            </div>
            {/* <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 self-start sm:self-auto">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Sistem terhubung
            </div> */}
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {portals.map((portal, index) => {
              const Icon = portal.icon;
              const isDisabled = portal.disabled;

              return (
                <div
                  key={portal.id}
                  className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 ${
                    isDisabled 
                      ? "border-gray-100 bg-gray-50/50 opacity-60 cursor-not-allowed" 
                      : "border-gray-200 bg-white hover:border-emerald-400 hover:shadow-md hover:-translate-y-1"
                  }`}
                >
                  {/* Nomor urut di pojok kanan atas */}
                  <span className={`absolute top-5 right-5 text-sm font-bold ${isDisabled ? 'text-gray-300' : 'text-emerald-600/30'}`}>
                    0{index + 1}
                  </span>

                  {/* Ikon */}
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl mb-6 ${isDisabled ? 'bg-gray-200 text-gray-400' : 'bg-emerald-50 text-emerald-600'}`}>
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </div>

                  <p className={`text-[10px] font-bold tracking-wider uppercase mb-1 ${isDisabled ? 'text-gray-400' : 'text-emerald-600'}`}>
                    {portal.role}
                  </p>
                  <h3 className="text-lg font-bold text-gray-900">{portal.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-gray-500 flex-1">
                    {portal.description}
                  </p>

                  {/* Action Button */}
                  {isDisabled ? (
                    <div className="mt-6 text-sm font-semibold text-gray-400 flex items-center justify-between">
                      Segera Hadir
                    </div>
                  ) : (
                    <Link 
                      to={portal.path}
                      className="mt-6 flex items-center justify-between text-sm font-semibold text-emerald-700 hover:text-emerald-800 group"
                    >
                      Masuk Portal
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white transition-transform group-hover:translate-x-1">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Footer Text */}
        <p className="mt-8 text-center text-xs text-gray-500">
          Copyright © 2025 - 2026 SkoolaGo. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}