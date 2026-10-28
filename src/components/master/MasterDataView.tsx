import React, { useState } from 'react';
import {
  Building2,
  Bike,
  Users,
  FileText,
  Sliders,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Filter,
  Check,
  ChevronRight,
  ShieldCheck,
  PhoneCall,
  MapPin
} from 'lucide-react';
import {
  mockMasterBranches,
  mockMasterProducts,
  mockMasterSurveyors,
  mockMasterScriptItems,
  mockMasterDocumentRules
} from '../../data/mockMasterData';
import {
  MasterBranch,
  MasterProduct,
  MasterSurveyor,
  MasterScriptItem,
  MasterDocumentRule
} from '../../types';

type MasterCategory = 'branches' | 'products' | 'surveyors' | 'scripts' | 'docRules';

export const MasterDataView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<MasterCategory>('branches');
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');

  // State collections with mutability for toggle/add demo
  const [branches, setBranches] = useState<MasterBranch[]>(mockMasterBranches);
  const [products, setProducts] = useState<MasterProduct[]>(mockMasterProducts);
  const [surveyors, setSurveyors] = useState<MasterSurveyor[]>(mockMasterSurveyors);
  const [scripts, setScripts] = useState<MasterScriptItem[]>(mockMasterScriptItems);
  const [docRules, setDocRules] = useState<MasterDocumentRule[]>(mockMasterDocumentRules);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Toggle surveyor status
  const handleToggleSurveyorStatus = (id: string) => {
    setSurveyors((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const newStatus = s.status === 'active' ? 'suspended' : 'active';
          showNotification(`Status ${s.fullName} diubah menjadi ${newStatus.toUpperCase()}`);
          return { ...s, status: newStatus };
        }
        return s;
      })
    );
  };

  // Toggle branch status
  const handleToggleBranchStatus = (id: string) => {
    setBranches((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const newStatus = b.status === 'active' ? 'inactive' : 'active';
          showNotification(`Status cabang ${b.name} diubah menjadi ${newStatus.toUpperCase()}`);
          return { ...b, status: newStatus };
        }
        return b;
      })
    );
  };

  // Toggle product status
  const handleToggleProductStatus = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newStatus = p.status === 'active' ? 'inactive' : 'active';
          showNotification(`Unit ${p.modelName} ${newStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan'}`);
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
  };

  // Filtered queries
  const filteredBranches = branches.filter((b) => {
    const matchQuery =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.region.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRegion = regionFilter === 'ALL' || b.region === regionFilter;
    return matchQuery && matchRegion;
  });

  const filteredProducts = products.filter(
    (p) =>
      p.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSurveyors = surveyors.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employeeNik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.deviceModel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredScripts = scripts.filter(
    (sc) =>
      sc.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDocRules = docRules.filter(
    (d) =>
      d.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.applicableProduct.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#1A1A1A]">
            Master Data &amp; Konfigurasi Operasional BAF
          </h2>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Pengelolaan entitas referensi institusional: data cabang, katalog unit pembiayaan, whitelist surveyor CMO, script tele-verifikasi, dan ambang batas dokumen.
          </p>
        </div>

        {/* Global Action Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => showNotification('Data master berhasil diekspor ke format CSV.')}
            className="px-3 py-2 rounded-lg border border-[#E5E5E3] bg-white text-xs font-medium text-[#1A1A1A] hover:bg-[#F7F7F5] transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <span>Ekspor Master Data</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 rounded-lg bg-[#16A34A]/10 border border-[#16A34A]/30 text-[#16A34A] text-xs font-medium flex items-center gap-2 transition-all">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* High-Level Institutional Master Stats (4 Key Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[#E5E5E3] bg-white">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
            <span>Cabang Terdaftar</span>
            <Building2 className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-bold text-[#1A1A1A] mt-2 font-mono">
            {branches.length} <span className="text-xs font-normal text-[#16A34A]">({branches.filter(b => b.status === 'active').length} Aktif)</span>
          </div>
          <div className="text-[11px] text-[#6B6B6B] mt-1">
            Tersebar di 5 Regional Kerja
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E5E3] bg-white">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
            <span>Katalog Unit Pembiayaan</span>
            <Bike className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-bold text-[#1A1A1A] mt-2 font-mono">
            {products.length} <span className="text-xs font-normal text-[#6B6B6B]">Model</span>
          </div>
          <div className="text-[11px] text-[#6B6B6B] mt-1">
            Yamaha Maxi, Classy &amp; Syariah
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E5E3] bg-white">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
            <span>Whitelist Surveyor CMO</span>
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-bold text-[#1A1A1A] mt-2 font-mono">
            {surveyors.length} <span className="text-xs font-normal text-[#D97706]">({surveyors.filter(s => s.status === 'suspended').length} Terkena Suspend)</span>
          </div>
          <div className="text-[11px] text-[#6B6B6B] mt-1">
            Tervalidasi IMEI &amp; Perangkat Resmi
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E5E3] bg-white">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
            <span>Kepatuhan Script OJK</span>
            <PhoneCall className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-bold text-[#1A1A1A] mt-2 font-mono">
            {scripts.length} <span className="text-xs font-normal text-[#16A34A]">Butir Wajib</span>
          </div>
          <div className="text-[11px] text-[#6B6B6B] mt-1">
            Bobot Total Verifikasi 100%
          </div>
        </div>
      </div>

      {/* Structured Category Navigation Strip */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveCategory('branches')}
            className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeCategory === 'branches'
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#1A1A1A]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Cabang &amp; Wilayah ({branches.length})</span>
          </button>

          <button
            onClick={() => setActiveCategory('products')}
            className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeCategory === 'products'
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#1A1A1A]'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Katalog Unit &amp; OTR ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveCategory('surveyors')}
            className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeCategory === 'surveyors'
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#1A1A1A]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Whitelist Surveyor CMO ({surveyors.length})</span>
          </button>

          <button
            onClick={() => setActiveCategory('scripts')}
            className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeCategory === 'scripts'
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#1A1A1A]'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Script Tele-Verifikasi ({scripts.length})</span>
          </button>

          <button
            onClick={() => setActiveCategory('docRules')}
            className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeCategory === 'docRules'
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#1A1A1A]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ambang Batas Dokumen ({docRules.length})</span>
          </button>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[240px] flex-1 sm:flex-initial">
          <Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari data master..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>

      {/* TAB CONTENT: 1. CABANG & WILAYAH */}
      {activeCategory === 'branches' && (
        <div className="bg-white border border-[#E5E5E3] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#E5E5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F7F5]">
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A]">
                Daftar Kantor Cabang &amp; Batas Geofence BAF
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                Mendefinisikan kode cabang LOS, koordinat sentral, dan batas radius survei maksimal per wilayah.
              </p>
            </div>
            <button
              onClick={() => showNotification('Modal Tambah Cabang dibuka')}
              className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Cabang Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFFFFF] border-b border-[#E5E5E3] text-[#6B6B6B] font-medium">
                <tr>
                  <th className="py-3 px-4">Kode Cabang</th>
                  <th className="py-3 px-4">Nama Kantor Cabang</th>
                  <th className="py-3 px-4">Regional</th>
                  <th className="py-3 px-4">Kepala Cabang</th>
                  <th className="py-3 px-4 text-center">CMO Aktif</th>
                  <th className="py-3 px-4 text-right">Maks. Radius</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E3]">
                {filteredBranches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-[#F7F7F5] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#1A1A1A]">
                      {branch.code}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#1A1A1A]">
                      <div>{branch.name}</div>
                      <div className="text-[11px] text-[#6B6B6B] truncate max-w-xs">{branch.address}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#1A1A1A]">
                      <span className="bg-[#F7F7F5] border border-[#E5E5E3] px-2 py-0.5 rounded text-[11px]">
                        {branch.region}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#1A1A1A]">{branch.manager}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-medium">{branch.activeSurveyors} orang</td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium">{branch.maxRadiusMeters} m</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          branch.status === 'active'
                            ? 'bg-[#16A34A]/10 text-[#16A34A]'
                            : 'bg-[#DC2626]/10 text-[#DC2626]'
                        }`}
                      >
                        {branch.status === 'active' ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleBranchStatus(branch.id)}
                        className="text-xs text-[#2563EB] hover:underline font-medium"
                      >
                        {branch.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. KATALOG PRODUK & OTR */}
      {activeCategory === 'products' && (
        <div className="bg-white border border-[#E5E5E3] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#E5E5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F7F5]">
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A]">
                Katalog Model Kendaraan &amp; Parameter Plafon BAF
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                Daftar unit resmi Yamaha &amp; lini dana syariah dengan ketentuan acuan OTR, batas DP minimal, dan suku bunga tahunan.
              </p>
            </div>
            <button
              onClick={() => showNotification('Modal Tambah Unit dibuka')}
              className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Unit Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFFFFF] border-b border-[#E5E5E3] text-[#6B6B6B] font-medium">
                <tr>
                  <th className="py-3 px-4">Kode Unit</th>
                  <th className="py-3 px-4">Model &amp; Varian</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Harga OTR Acuan</th>
                  <th className="py-3 px-4 text-center">Min. DP</th>
                  <th className="py-3 px-4 text-center">Maks. Tenor</th>
                  <th className="py-3 px-4 text-right">Bunga/Thn</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E3]">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F7F7F5] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#1A1A1A]">{p.code}</td>
                    <td className="py-3.5 px-4 font-semibold text-[#1A1A1A]">
                      <div>{p.modelName}</div>
                      <div className="text-[11px] text-[#6B6B6B] font-normal">{p.brand} {p.engineCc > 0 ? `· ${p.engineCc} cc` : ''}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-[#F7F7F5] border border-[#E5E5E3] px-2 py-0.5 rounded text-[11px] text-[#1A1A1A]">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#1A1A1A]">
                      Rp {p.otrPrice.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">{p.minDownPaymentPercent}%</td>
                    <td className="py-3.5 px-4 text-center font-mono">{p.maxTenorMonths} Bln</td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#2563EB] font-medium">{p.annualInterestRate}%</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          p.status === 'active'
                            ? 'bg-[#16A34A]/10 text-[#16A34A]'
                            : 'bg-[#DC2626]/10 text-[#DC2626]'
                        }`}
                      >
                        {p.status === 'active' ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleProductStatus(p.id)}
                        className="text-xs text-[#2563EB] hover:underline font-medium"
                      >
                        {p.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. WHITELIST SURVEYOR */}
      {activeCategory === 'surveyors' && (
        <div className="bg-white border border-[#E5E5E3] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#E5E5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F7F5]">
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A]">
                Whitelist Surveyor Lapangan (CMO) &amp; Perangkat Mobile
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                Otorisasi identitas perangkat Android resmi untuk mencegah pemasangan FakeGPS dan survei liar dari luar wilayah tugas.
              </p>
            </div>
            <button
              onClick={() => showNotification('Modal Tambah Surveyor dibuka')}
              className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Daftarkan Surveyor Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFFFFF] border-b border-[#E5E5E3] text-[#6B6B6B] font-medium">
                <tr>
                  <th className="py-3 px-4">NIK Karyawan</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Cabang Penempatan</th>
                  <th className="py-3 px-4">Model Handphone Terdaftar</th>
                  <th className="py-3 px-4">IMEI Hardware</th>
                  <th className="py-3 px-4 text-center">Pelanggaran FakeGPS</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E3]">
                {filteredSurveyors.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F7F7F5] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#1A1A1A]">{s.employeeNik}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1A1A1A]">{s.fullName}</div>
                      <div className="text-[11px] text-[#6B6B6B]">{s.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#1A1A1A]">{s.branchName}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#1A1A1A]">{s.deviceModel}</div>
                      <div className="text-[11px] text-[#6B6B6B] font-mono">{s.osVersion}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#6B6B6B]">{s.deviceImei}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                          s.mockLocationStrikes > 1
                            ? 'bg-[#DC2626]/10 text-[#DC2626]'
                            : s.mockLocationStrikes === 1
                            ? 'bg-[#D97706]/10 text-[#D97706]'
                            : 'bg-[#16A34A]/10 text-[#16A34A]'
                        }`}
                      >
                        {s.mockLocationStrikes}x Strike
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          s.status === 'active'
                            ? 'bg-[#16A34A]/10 text-[#16A34A]'
                            : 'bg-[#DC2626]/10 text-[#DC2626]'
                        }`}
                      >
                        {s.status === 'active' ? 'Aktif' : 'Disuspend'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleSurveyorStatus(s.id)}
                        className={`text-xs font-medium hover:underline ${
                          s.status === 'active' ? 'text-[#DC2626]' : 'text-[#16A34A]'
                        }`}
                      >
                        {s.status === 'active' ? 'Suspend CMO' : 'Pulihkan Akun'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. SCRIPT TELE-VERIFIKASI */}
      {activeCategory === 'scripts' && (
        <div className="bg-white border border-[#E5E5E3] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#E5E5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F7F5]">
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A]">
                Kamus Script Tele-Verifikasi &amp; Standar Kepatuhan OJK
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                Daftar pertanyaan wajib dan kata kunci yang dipindai secara otomatis oleh mesin ASR speech-to-text saat verifikasi telepon.
              </p>
            </div>
            <button
              onClick={() => showNotification('Modal Tambah Script dibuka')}
              className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pertanyaan Script</span>
            </button>
          </div>

          <div className="divide-y divide-[#E5E5E3]">
            {filteredScripts.map((sc) => (
              <div key={sc.id} className="p-4 hover:bg-[#F7F7F5] transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-[#E5E5E3] px-2 py-0.5 rounded text-[#1A1A1A]">
                      No. {sc.sequence}
                    </span>
                    <span className="text-xs font-semibold text-[#2563EB]">
                      {sc.category}
                    </span>
                    {sc.isMandatory && (
                      <span className="text-[10px] bg-[#DC2626]/10 text-[#DC2626] px-1.5 py-0.5 rounded font-bold uppercase">
                        Wajib OJK
                      </span>
                    )}
                    <span className="text-xs text-[#6B6B6B]">· Bobot: {sc.weightPercent}%</span>
                  </div>

                  <p className="text-xs text-[#1A1A1A] font-medium leading-relaxed bg-white p-3 rounded-lg border border-[#E5E5E3]">
                    "{sc.questionText}"
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                    <span className="text-[#6B6B6B]">Kata Kunci Terdeteksi AI:</span>
                    {sc.expectedKeywords.map((kw, i) => (
                      <span key={i} className="bg-[#2563EB]/10 text-[#2563EB] px-2 py-0.5 rounded text-[11px] font-mono">
                        +{kw}
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] text-[#6B6B6B] italic">
                    Catatan Kepatuhan: {sc.complianceNotes}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => showNotification(`Script No. ${sc.sequence} diedit`)}
                    className="px-3 py-1.5 rounded-lg border border-[#E5E5E3] text-xs font-medium text-[#1A1A1A] hover:bg-[#E5E5E3] transition-colors"
                  >
                    Edit Script
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. AMBANG BATAS DOKUMEN */}
      {activeCategory === 'docRules' && (
        <div className="bg-white border border-[#E5E5E3] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#E5E5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F7F5]">
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A]">
                Katalog Dokumen Pengajuan &amp; Ambang Batas Validasi AI
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                Menentukan dokumen wajib per kategori pembiayaan, toleransi skor OCR minimum, dan verifikasi biometrik wajah.
              </p>
            </div>
            <button
              onClick={() => showNotification('Modal Aturan Dokumen dibuka')}
              className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Aturan Dokumen</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFFFFF] border-b border-[#E5E5E3] text-[#6B6B6B] font-medium">
                <tr>
                  <th className="py-3 px-4">Jenis Dokumen</th>
                  <th className="py-3 px-4">Produk Berlaku</th>
                  <th className="py-3 px-4 text-center">Status Wajib</th>
                  <th className="py-3 px-4 text-center">Min. OCR Confidence</th>
                  <th className="py-3 px-4 text-center">Min. Biometric Match</th>
                  <th className="py-3 px-4 text-center">Auto-Reject Tamper</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E3]">
                {filteredDocRules.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F7F7F5] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#1A1A1A]">
                      <div>{r.documentType}</div>
                      <div className="text-[11px] text-[#6B6B6B] font-normal truncate max-w-sm">{r.description}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#1A1A1A]">
                      <span className="bg-[#F7F7F5] border border-[#E5E5E3] px-2 py-0.5 rounded text-[11px]">
                        {r.applicableProduct}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          r.isMandatory
                            ? 'bg-[#16A34A]/10 text-[#16A34A]'
                            : 'bg-[#6B6B6B]/10 text-[#6B6B6B]'
                        }`}
                      >
                        {r.isMandatory ? 'Wajib' : 'Kondisional'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold">
                      {r.minOcrConfidence > 0 ? `${r.minOcrConfidence}%` : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold">
                      {r.minBiometricMatch > 0 ? `${r.minBiometricMatch}%` : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {r.autoRejectOnTamper ? (
                        <span className="text-[#DC2626] font-semibold text-[11px]">YA (Hard Flag)</span>
                      ) : (
                        <span className="text-[#6B6B6B] text-[11px]">Review Manual</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => showNotification(`Aturan ${r.documentType} diedit`)}
                        className="text-xs text-[#2563EB] hover:underline font-medium"
                      >
                        Ubah Batas
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
