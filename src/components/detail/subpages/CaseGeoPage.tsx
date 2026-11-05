import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Camera,
  Smartphone,
  Navigation,
  ShieldAlert,
  Info,
  Clock,
  UserCheck,
  Calendar,
  Layers,
  Sparkles,
  X,
  Maximize2
} from 'lucide-react';
import { FinancingCase, SurveyPhoto } from '../../../types';
import { RealCaseMiniMap } from '../RealCaseMiniMap';

interface CaseGeoPageProps {
  caseData: FinancingCase;
  initialSelectedPhoto?: SurveyPhoto | null;
}

export const CaseGeoPage: React.FC<CaseGeoPageProps> = ({
  caseData,
  initialSelectedPhoto = null,
}) => {
  const { geo, customerName } = caseData;
  const [selectedPhoto, setSelectedPhoto] = useState<SurveyPhoto | null>(initialSelectedPhoto);

  return (
    <div className="space-y-6">
 {/* Top Banner: Verification Status */}
 <div className="p-5 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
 Page 3: Geospatial &amp; Field Survey Forensics
 </span>
 <span className="text-xs text-[#6B6B6B]">·</span>
 <span
 className={`text-xs font-semibold px-2 py-0.5 rounded ${
 geo.distanceStatus === 'red' || geo.isMockLocationDetected
 ? 'bg-[#DC2626]/10 text-[#DC2626]'
 : geo.distanceStatus === 'yellow'
 ? 'bg-[#D97706]/10 text-[#D97706]'
 : 'bg-[#16A34A]/10 text-[#16A34A]'
 }`}
 >
 Survey Anomaly Score: {geo.score}/100 ({geo.distanceStatus === 'red' ? 'High Risk' : geo.distanceStatus === 'yellow' ? 'Medium' : 'Clean / Verified'})
 </span>
 </div>
 <p className="text-xs text-[#1A1A1A] mt-1.5 leading-relaxed max-w-3xl">
 Calculates geodesic distance between actual surveyor GPS location and the customer's registered residence, inspecting Android Mock Location providers, mock apps, and CameraX EXIF authenticity.
 </p>
 </div>

 <div className="flex items-center gap-4 shrink-0 bg-white p-3 rounded-xl border border-[#E5E5E3]">
 <div>
 <div className="text-[11px] text-[#6B6B6B]">Geodesic Distance</div>
 <div
 className={`text-base font-bold ${
 geo.distanceStatus === 'green'
 ? 'text-[#16A34A]'
 : geo.distanceStatus === 'yellow'
 ? 'text-[#D97706]'
 : 'text-[#DC2626]'
 }`}
 >
 {geo.distanceMeters.toLocaleString()} m
 </div>
 </div>
 <div className="w-px h-8 bg-[#E5E5E3]" />
 <div>
 <div className="text-[11px] text-[#6B6B6B]">GPS Integrity</div>
 <div className="text-xs font-semibold flex items-center gap-1">
 {geo.isMockLocationDetected ? (
 <span className="text-[#DC2626] flex items-center gap-1 font-bold">
 <AlertTriangle className="w-3.5 h-3.5" /> Fake GPS Alert
 </span>
 ) : (
 <span className="text-[#16A34A] flex items-center gap-1">
 <CheckCircle2 className="w-3.5 h-3.5" /> Genuine Hardware GPS
 </span>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Main Grid: Interactive Map Workspace + Security Forensics */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
 {/* Left Column (7 cols): Interactive Geofence Map */}
 <div className="lg:col-span-7 space-y-4">
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-4 space-y-3">
 <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
 <div>
 <h3 className="text-xs font-semibold text-[#1A1A1A]">
 Geofence Radar &amp; Surveyor Location Map
 </h3>
 <p className="text-[11px] text-[#6B6B6B] mt-0.5">
 OpenStreetMap spatial visualization with real-time radius circles
 </p>
 </div>
 <div className="flex items-center gap-2 text-[11px] ">
 <span className="flex items-center gap-1 text-[#2563EB]">
 <span className="w-2 h-2 rounded-full bg-[#2563EB]" /> Target Residence
 </span>
 <span className="flex items-center gap-1 text-[#D97706]">
 <span className="w-2 h-2 rounded-full bg-[#D97706]" /> Surveyor GPS
 </span>
 </div>
 </div>

 {/* Interactive Leaflet Map Component */}
 <div className="h-[380px] rounded-lg overflow-hidden border border-[#E5E5E3]">
 <RealCaseMiniMap geo={geo} customerName={customerName} />
 </div>

 {/* Legend & Address Meta */}
 <div className="p-3 bg-[#F7F7F5] rounded-lg border border-[#E5E5E3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
 <div className="space-y-0.5">
 <div className="text-[10px] text-[#6B6B6B] uppercase font-semibold">Registered Address:</div>
 <div className="text-[#1A1A1A] font-medium">{geo.targetAddress}</div>
 </div>
 <div className="text-right sm:shrink-0 text-[11px] text-[#6B6B6B]">
 Lat: {geo.surveyLat.toFixed(5)}, Lng: {geo.surveyLng.toFixed(5)}
 </div>
 </div>
 </div>

 {/* Field Surveyor Details & SLA */}
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-3">
 <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
 <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
 <UserCheck className="w-3.5 h-3.5 text-[#2563EB]" />
 <span>Field Surveyor Assignment &amp; SLA</span>
 </div>
 <span className="text-[10px] text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded font-semibold">
 SLA: 24 Mins (On-Target)
 </span>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
 <div className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
 <div className="text-[10px] text-[#6B6B6B]">Surveyor Name</div>
 <div className="font-semibold text-[#1A1A1A] mt-0.5">{geo.surveyorName}</div>
 <div className="text-[10px] text-[#6B6B6B] ">ID: {geo.surveyorId}</div>
 </div>
 <div className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
 <div className="text-[10px] text-[#6B6B6B]">Visit Timestamp</div>
 <div className="font-semibold text-[#1A1A1A] mt-0.5">{geo.surveyTimestamp.split(' ')[1]} WIB</div>
 <div className="text-[10px] text-[#6B6B6B] ">{geo.surveyTimestamp.split(' ')[0]}</div>
 </div>
 <div className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
 <div className="text-[10px] text-[#6B6B6B]">Survey Duration</div>
 <div className="font-semibold text-[#1A1A1A] mt-0.5">18 Minutes</div>
 <div className="text-[10px] text-[#6B6B6B]">Target: &lt; 30m</div>
 </div>
 <div className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
 <div className="text-[10px] text-[#6B6B6B]">Neighbor Cross-check</div>
 <div className="font-semibold text-[#16A34A] mt-0.5">Verified RT 04</div>
 <div className="text-[10px] text-[#6B6B6B]">Confirmed identity</div>
 </div>
 </div>
 </div>
 </div>

 {/* Right Column (5 cols): Anti-Spoofing & Survey Photos */}
 <div className="lg:col-span-5 space-y-4">
 {/* Anti-Spoofing & Device Integrity Card */}
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
 <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
 <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
 <Smartphone className="w-3.5 h-3.5 text-[#2563EB]" />
 <span>Surveyor Device Integrity &amp; GPS Forensics</span>
 </div>
 <span
 className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
 geo.isMockLocationDetected
 ? 'bg-[#DC2626]/10 text-[#DC2626]'
 : 'bg-[#16A34A]/10 text-[#16A34A]'
 }`}
 >
 {geo.isMockLocationDetected ? 'Compromised' : 'Hardware Safe'}
 </span>
 </div>

 <div className="space-y-2.5 text-xs">
 <div className="flex items-center justify-between text-[#6B6B6B] pb-1.5 border-b border-[#E5E5E3]">
 <span>Android `isFromMockProvider()`:</span>
 <span className={` font-semibold ${geo.isMockLocationDetected ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
 {geo.isMockLocationDetected ? 'TRUE (Active)' : 'FALSE (Genuine)'}
 </span>
 </div>
 <div className="flex items-center justify-between text-[#6B6B6B] pb-1.5 border-b border-[#E5E5E3]">
 <span>Mock Provider Package:</span>
 <span className={` ${geo.isMockLocationDetected ? 'text-[#DC2626] font-semibold' : 'text-[#16A34A]'}`}>
 {geo.isMockLocationDetected ? (geo.mockLocationReason || 'com.lexa.fakegps') : 'None (No fake GPS apps)'}
 </span>
 </div>
 <div className="flex items-center justify-between text-[#6B6B6B] pb-1.5 border-b border-[#E5E5E3]">
 <span>GPS Horizontal Accuracy:</span>
 <span className=" text-[#1A1A1A] font-semibold">± 4.8 meters</span>
 </div>
 <div className="flex items-center justify-between text-[#6B6B6B] pb-1.5 border-b border-[#E5E5E3]">
 <span>GPS Satellite Constellation:</span>
 <span className=" text-[#1A1A1A]">14 Satellites (GLONASS + GPS)</span>
 </div>
 <div className="flex items-center justify-between text-[#6B6B6B]">
 <span>Camera Source:</span>
 <span className="text-[#16A34A] font-semibold flex items-center gap-1">
 <CheckCircle2 className="w-3.5 h-3.5" /> In-App CameraX (No Gallery)
 </span>
 </div>
 </div>

 {geo.isMockLocationDetected && (
 <div className="p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 space-y-1">
 <div className="text-xs font-semibold text-[#DC2626] flex items-center gap-1">
 <AlertTriangle className="w-3.5 h-3.5" />
 <span>Fraud Alert: Mock Location Provider Active</span>
 </div>
 <p className="text-[11px] text-[#DC2626] leading-relaxed">
 The surveyor device enabled developer mock locations, transmitting simulated GPS coordinates. This application should be held for re-survey or escalated.
 </p>
 </div>
 )}
 </div>

 {/* Field Photographic Evidence Gallery */}
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
 <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
 <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
 <Camera className="w-3.5 h-3.5 text-[#2563EB]" />
 <span>CameraX Field Survey Photos</span>
 </div>
 <span className="text-[11px] text-[#6B6B6B] ">
 {geo.surveyPhotos.length} Captured Images
 </span>
 </div>

 {/* Survey Photos Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {geo.surveyPhotos.map((photo) => (
 <div
 key={photo.id}
 onClick={() => setSelectedPhoto(photo)}
 className="rounded-lg border border-[#E5E5E3] overflow-hidden bg-white hover:border-[#2563EB] transition-all cursor-pointer group flex flex-col justify-between"
 >
 <div className="relative aspect-video bg-slate-950 overflow-hidden flex flex-col justify-between p-2.5 text-white">
 {photo.imageUrl ? (
 <img
 src={photo.imageUrl}
 alt={photo.caption}
 className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
 />
 ) : (
 <div className="text-center my-auto opacity-75 z-10">
 <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center mx-auto mb-1 bg-white/10">
 <Camera className="w-4 h-4 text-white" />
 </div>
 <div className="text-xs font-semibold truncate max-w-[200px] mx-auto">{photo.caption}</div>
 <div className="text-[10px] text-white/70 uppercase">
 TYPE: {photo.photoType}
 </div>
 </div>
 )}

 {/* Top overlay: CameraX badge & timestamp */}
 <div className="flex items-center justify-between text-[10px] z-10 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded">
 <span className="flex items-center gap-1">
 <Camera className="w-3 h-3 text-[#16A34A]" />
 <span>CameraX In-App Verified</span>
 </span>
 <span className="text-cyan-300 text-[9px]">{photo.timestamp.split(' ')[1]} WIB</span>
 </div>

 {/* Subtle gradient overlay */}
 <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

 {/* Bottom overlay: coordinates & CameraX Live */}
 <div className="z-10 flex items-center justify-between text-[10px] text-slate-300 pointer-events-none">
 <span className="font-mono bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/50">
 {photo.lat.toFixed(5)}, {photo.lng.toFixed(5)}
 </span>
 <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
 CameraX Live
 </span>
 </div>
 </div>

 {/* Card info footer */}
 <div className="p-2.5 bg-[#F7F7F5] border-t border-[#E5E5E3] flex items-center justify-between">
 <div className="min-w-0 flex-1 pr-2">
 <div className="text-xs font-semibold text-[#1A1A1A] truncate">{photo.caption}</div>
 <div className="text-[10px] text-[#6B6B6B]">{photo.timestamp} WIB</div>
 </div>
 <span className="text-[10px] text-[#2563EB] font-medium shrink-0 group-hover:underline flex items-center gap-0.5">
 <Maximize2 className="w-3 h-3" />
 Buka
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* Lightbox Modal Preview */}
 {selectedPhoto && (
 <div
 className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
 onClick={() => setSelectedPhoto(null)}
 >
 <div
 className="bg-white border border-[#E5E5E3] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Photo Preview Pane */}
 <div className="relative flex-1 bg-black flex items-center justify-center min-h-[360px] p-4">
 {selectedPhoto.imageUrl ? (
 <img
 src={selectedPhoto.imageUrl}
 alt={selectedPhoto.caption}
 className="max-h-[72vh] w-auto max-w-full object-contain rounded"
 />
 ) : (
 <div className="text-center text-white/75 p-8">
 <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-3 bg-white/10">
 <Camera className="w-8 h-8 text-white/80" />
 </div>
 <p className="text-sm font-semibold">{selectedPhoto.caption}</p>
 <p className="text-xs text-white/50 mt-1 uppercase">TYPE: {selectedPhoto.photoType}</p>
 <p className="text-xs text-white/40 mt-1">Simulated Hardware Capture Placeholder</p>
 </div>
 )}

 {/* Live Watermark on Photo */}
 <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white bg-black/70 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10 pointer-events-none">
 <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
 <Camera className="w-3.5 h-3.5" />
 CameraX In-App Verified
 </span>
 <span className="font-mono text-amber-300">
 {selectedPhoto.lat.toFixed(6)}, {selectedPhoto.lng.toFixed(6)}
 </span>
 </div>
 </div>

 {/* EXIF & Forensics Side Panel */}
 <div className="w-full md:w-84 p-5 flex flex-col justify-between bg-white border-t md:border-t-0 md:border-l border-[#E5E5E3] overflow-y-auto max-h-[90vh]">
 <div className="space-y-4">
 <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
 <div>
 <h4 className="text-sm font-bold text-[#1A1A1A]">EXIF &amp; Forensics</h4>
 <p className="text-[11px] text-[#6B6B6B]">Field Survey Photographic Proof</p>
 </div>
 <button
 onClick={() => setSelectedPhoto(null)}
 className="p-1.5 text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F7F5] rounded-lg transition-colors cursor-pointer"
 aria-label="Close modal"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="space-y-3 text-xs">
 <div>
 <span className="text-[10px] text-[#6B6B6B] uppercase font-semibold">Photo Label</span>
 <p className="font-semibold text-[#1A1A1A] mt-0.5">{selectedPhoto.caption}</p>
 </div>

 <div className="grid grid-cols-2 gap-2">
 <div className="p-2.5 bg-[#F7F7F5] rounded-lg border border-[#E5E5E3]">
 <span className="text-[10px] text-[#6B6B6B] uppercase">Photo ID</span>
 <p className="font-mono font-semibold text-[#1A1A1A] mt-0.5">{selectedPhoto.id}</p>
 </div>
 <div className="p-2.5 bg-[#F7F7F5] rounded-lg border border-[#E5E5E3]">
 <span className="text-[10px] text-[#6B6B6B] uppercase">Type</span>
 <p className="font-semibold text-[#1A1A1A] mt-0.5 capitalize">{selectedPhoto.photoType.replace(/_/g, ' ')}</p>
 </div>
 </div>

 <div className="p-2.5 bg-[#F7F7F5] rounded-lg border border-[#E5E5E3] space-y-1.5">
 <div className="flex justify-between items-center">
 <span className="text-[#6B6B6B]">GPS Latitude:</span>
 <span className="font-mono font-semibold text-[#1A1A1A]">{selectedPhoto.lat.toFixed(6)}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[#6B6B6B]">GPS Longitude:</span>
 <span className="font-mono font-semibold text-[#1A1A1A]">{selectedPhoto.lng.toFixed(6)}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[#6B6B6B]">Timestamp:</span>
 <span className="font-semibold text-[#1A1A1A]">{selectedPhoto.timestamp} WIB</span>
 </div>
 </div>

 <div className="space-y-2">
 <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800">
 <span className="flex items-center gap-1.5 font-medium">
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
 CameraX Live Source
 </span>
 <span className="text-[10px] uppercase font-bold">Passed</span>
 </div>

 <div
 className={`flex items-center justify-between p-2.5 rounded-lg ${
 selectedPhoto.hasExifTamper
 ? 'bg-red-500/10 border border-red-500/20 text-red-700'
 : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-800'
 }`}
 >
 <div className="flex items-center gap-1.5 font-medium">
 {selectedPhoto.hasExifTamper ? (
 <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
 ) : (
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
 )}
 <span>EXIF Tamper Check</span>
 </div>
 <span className="text-[10px] uppercase font-bold">
 {selectedPhoto.hasExifTamper ? 'Tampered' : 'Genuine CameraX Hardware Signature (Passed)'}
 </span>
 </div>
 </div>
 </div>
 </div>

 <div className="pt-4 border-t border-[#E5E5E3] flex justify-end">
 <button
 onClick={() => setSelectedPhoto(null)}
 className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#333333] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
 >
 Tutup Preview
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};
