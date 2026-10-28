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
 Info
} from 'lucide-react';
import { GeoSurvey } from '../../types';
import { RealCaseMiniMap } from './RealCaseMiniMap';

interface GeoSurveyTabProps {
 geo: GeoSurvey;
 customerName: string;
}

export const GeoSurveyTab: React.FC<GeoSurveyTabProps> = ({ geo, customerName }) => {
 const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

 const selectedPhoto = geo.surveyPhotos[selectedPhotoIndex] || geo.surveyPhotos[0];

 return (
 <div className="space-y-6">
 {/* Top Banner: Verification Status */}
 <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
 Pillar 2: Geotag &amp; Field Survey (Weight: 30%)
 </span>
 <span className="text-xs text-[#6B6B6B]">·</span>
 <span
 className={`text-xs font-medium ${
 geo.distanceStatus === 'red' || geo.isMockLocationDetected
 ? 'text-[#DC2626]'
 : geo.distanceStatus === 'yellow'
 ? 'text-[#D97706]'
 : 'text-[#16A34A]'
 }`}
 >
 Anomaly Score: {geo.score}/100 ({geo.distanceStatus === 'red' ? 'High Risk' : geo.distanceStatus === 'yellow' ? 'Medium' : 'Nominal / Safe'})
 </span>
 </div>
 <p className="text-xs text-[#1A1A1A] mt-1">
 Audits surveyor GPS coordinates, computes geodesic deviation against registered residence, and identifies Android Mock Location spoofing.
 </p>
 </div>

 <div className="flex items-center gap-3 shrink-0">
 <div className="text-right">
 <div className="text-xs text-[#6B6B6B]">Measured Distance to Address</div>
 <div
 className={`text-sm font-semibold tabular-nums ${
 geo.distanceStatus === 'green'
 ? 'text-[#16A34A]'
 : geo.distanceStatus === 'yellow'
 ? 'text-[#D97706]'
 : 'text-[#DC2626]'
 }`}
 >
 {geo.distanceMeters} meters ({geo.distanceStatus === 'green' ? '≤200m Green' : geo.distanceStatus === 'yellow' ? '201m-1km Yellow' : '>1km Red'})
 </div>
 </div>
 </div>
 </div>

 {/* Grid: Survey Photos & EXIF + Distance Calculation & Mini Map Radar */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* Left Column (5 cols): Surveyor Photos from In-App Camera */}
 <div className="lg:col-span-5 space-y-4">
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-4">
 <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3 mb-3">
 <div>
 <h4 className="text-sm font-semibold text-[#1A1A1A]">
 Surveyor Field Photographic Evidence
 </h4>
 <p className="text-xs text-[#6B6B6B]">
 Mandatory in-app capture via CameraX API
 </p>
 </div>
 <span className="text-[11px] text-[#16A34A] font-medium flex items-center gap-1">
 <Camera className="w-3.5 h-3.5" />
 <span>In-App Hardware Lock</span>
 </span>
 </div>

 {/* Photo Preview Canvas */}
 <div className="relative rounded-lg overflow-hidden border border-[#E5E5E3] bg-[#1A1A1A] aspect-[4/3] flex items-center justify-center">
 <div className="w-full h-full bg-slate-800 flex flex-col justify-between p-3 text-white relative">
 {/* Visual placeholder */}
 <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
 {selectedPhoto.photoType === 'house_front' && (
 <div className="text-center">
 <MapPin className="w-16 h-16 mx-auto mb-1" />
 <span className="text-xs ">APPLICANT RESIDENCE FRONTAGE</span>
 </div>
 )}
 {selectedPhoto.photoType === 'electricity_meter' && (
 <div className="text-center">
 <ZapIcon className="w-16 h-16 mx-auto mb-1 text-amber-400" />
 <span className="text-xs ">PLN KWH ELECTRICITY METER</span>
 </div>
 )}
 {selectedPhoto.photoType === 'selfie_with_applicant' && (
 <div className="text-center">
 <Camera className="w-16 h-16 mx-auto mb-1 text-cyan-400" />
 <span className="text-xs ">SURVEYOR SELFIE WITH APPLICANT</span>
 </div>
 )}
 {selectedPhoto.photoType === 'street_view' && (
 <div className="text-center">
 <Navigation className="w-16 h-16 mx-auto mb-1 text-emerald-400" />
 <span className="text-xs ">ALLEY ENTRANCE &amp; STREET SIGN</span>
 </div>
 )}
 </div>

 {/* Top Overlay Badge */}
 <div className="flex items-center justify-between text-[10px] z-10 bg-black/60 backdrop-blur-sm px-2 py-1 rounded">
 <span>{selectedPhoto.caption}</span>
 <span className="text-cyan-300">BAF Surveyor Mobile</span>
 </div>

 {/* Bottom Watermark Inset */}
 <div className="z-10 bg-black/75 backdrop-blur-sm p-2 rounded text-[10px] space-y-0.5 border border-white/10 ">
 <div className="flex justify-between">
 <span className="text-gray-400">TIMESTAMP:</span>
 <span>{selectedPhoto.timestamp} WIB</span>
 </div>
 <div className="flex justify-between">
 <span className="text-gray-400">GPS COORDINATES:</span>
 <span className="text-amber-300">
 {selectedPhoto.lat.toFixed(6)}, {selectedPhoto.lng.toFixed(6)}
 </span>
 </div>
 <div className="flex justify-between">
 <span className="text-gray-400">SURVEYOR:</span>
 <span>{geo.surveyorName} ({geo.surveyorId})</span>
 </div>
 </div>
 </div>
 </div>

 {/* Photo Thumbnails */}
 <div className="grid grid-cols-3 gap-2 mt-3">
 {geo.surveyPhotos.map((photo, index) => (
 <button
 key={photo.id}
 onClick={() => setSelectedPhotoIndex(index)}
 className={`p-2 rounded-lg text-left text-xs border transition-colors ${
 selectedPhotoIndex === index
 ? 'border-[#2563EB] bg-[#2563EB]/5 text-[#1A1A1A] font-medium'
 : 'border-[#E5E5E3] hover:bg-[#F7F7F5] text-[#6B6B6B]'
 }`}
 >
 <div className="truncate font-medium">{photo.caption}</div>
 <div className="text-[10px] text-[#6B6B6B] mt-0.5 ">
 {photo.timestamp.split(' ')[1]}
 </div>
 </button>
 ))}
 </div>

 {/* EXIF Integrity Inspector */}
 <div className="mt-4 pt-3 border-t border-[#E5E5E3] space-y-2 text-xs">
 <div className="font-semibold text-[#1A1A1A] flex items-center justify-between">
 <span>Hardware &amp; EXIF Integrity</span>
 <span className="text-[11px] text-[#16A34A] font-medium">Authentic (CameraX API)</span>
 </div>
 <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#F7F7F5] p-2 rounded-lg text-[#6B6B6B]">
 <div>
 <span className="text-[#1A1A1A] font-medium">Device:</span> Samsung SM-A546E
 </div>
 <div>
 <span className="text-[#1A1A1A] font-medium">OS:</span> Android 14 (OneUI 6.1)
 </div>
 <div>
 <span className="text-[#1A1A1A] font-medium">GPS Precision:</span> ± 8.4 meters
 </div>
 <div>
 <span className="text-[#1A1A1A] font-medium">Altitude:</span> 24.2m ASL
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Right Column (7 cols): Geofencing Radar & Mock Location Verification */}
 <div className="lg:col-span-7 space-y-4">
 {/* Card 1: Mock Location Detector */}
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5">
 <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3 mb-3">
 <div>
 <h4 className="text-sm font-semibold text-[#1A1A1A]">
 Location Spoofing Detection (Mock GPS)
 </h4>
 <p className="text-xs text-[#6B6B6B] mt-0.5">
 Inspection of FusedLocationProviderClient flags and Android developer options.
 </p>
 </div>
 <div>
 {geo.isMockLocationDetected ? (
 <span className="text-xs font-semibold text-[#DC2626] flex items-center gap-1">
 <ShieldAlert className="w-4 h-4" />
 <span>Mock GPS Detected</span>
 </span>
 ) : (
 <span className="text-xs font-semibold text-[#16A34A] flex items-center gap-1">
 <CheckCircle2 className="w-4 h-4" />
 <span>Real Hardware GPS (Valid)</span>
 </span>
 )}
 </div>
 </div>

 {geo.isMockLocationDetected ? (
 <div className="p-3 rounded-lg bg-[#DC2626]/5 border border-[#DC2626]/20 text-xs text-[#DC2626] space-y-1">
 <div className="font-semibold flex items-center gap-1.5">
 <AlertTriangle className="w-3.5 h-3.5" />
 <span>Location Fraud Warning:</span>
 </div>
 <p className="text-[11px] leading-relaxed">
 {geo.mockLocationReason || 'Android API returned isFromMockProvider = true. Location spoofing tool was running during camera capture.'}
 </p>
 </div>
 ) : (
 <div className="p-3 rounded-lg bg-[#16A34A]/5 border border-[#16A34A]/20 text-xs text-[#16A34A] flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 shrink-0" />
 <span>
 No mock location providers or Fake GPS packages were active on this survey session.
 </span>
 </div>
 )}
 </div>

 {/* Card 2: Interactive Geodesic Distance Radar & Coordinates Map */}
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5">
 <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3 mb-4">
 <div>
 <h4 className="text-sm font-semibold text-[#1A1A1A]">
 Geodesic Radius Calculation
 </h4>
 <p className="text-xs text-[#6B6B6B] mt-0.5">
 Distance comparison between registered KTP residence and surveyor check-in location.
 </p>
 </div>
 <div className="text-right">
 <span className=" text-xs text-[#6B6B6B]">
 Formula: Haversine / PostGIS ST_Distance
 </span>
 </div>
 </div>

 {/* Real Interactive Street Map showing Address vs Surveyor Pin */}
 <div className="mb-4">
 <RealCaseMiniMap geo={geo} customerName={customerName} height="260px" />
 </div>

 {/* Coordinate Comparison Table */}
 <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
 <div className="p-3 rounded-lg border border-[#E5E5E3] bg-white">
 <div className="text-[#6B6B6B] font-medium mb-1 flex items-center gap-1.5">
 <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
 <span>Applicant Registered Coordinates:</span>
 </div>
 <div className=" text-[#1A1A1A]">
 {geo.targetLat.toFixed(6)}, {geo.targetLng.toFixed(6)}
 </div>
 <p className="text-[11px] text-[#6B6B6B] mt-1 truncate" title={geo.targetAddress}>
 {geo.targetAddress}
 </p>
 </div>

 <div className="p-3 rounded-lg border border-[#E5E5E3] bg-white">
 <div className="text-[#6B6B6B] font-medium mb-1 flex items-center gap-1.5">
 <Navigation className="w-3.5 h-3.5 text-[#16A34A]" />
 <span>Surveyor Check-in Coordinates:</span>
 </div>
 <div className=" text-[#1A1A1A]">
 {geo.surveyLat.toFixed(6)}, {geo.surveyLng.toFixed(6)}
 </div>
 <p className="text-[11px] text-[#6B6B6B] mt-1">
 Field Agent: {geo.surveyorName} · {geo.surveyTimestamp}
 </p>
 </div>
 </div>

 {/* Threshold rules footer */}
 <div className="mt-3 pt-3 border-t border-[#E5E5E3] flex flex-wrap items-center justify-between text-[11px] text-[#6B6B6B]">
 <div className="flex items-center gap-3">
 <span className="flex items-center gap-1">
 <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
 <span>&le;200m: Green (Normal)</span>
 </span>
 <span className="flex items-center gap-1">
 <span className="w-2 h-2 rounded-full bg-[#D97706]" />
 <span>201–1,000m: Yellow (Requires Justification)</span>
 </span>
 <span className="flex items-center gap-1">
 <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
 <span>&gt;1,000m: Red (Anomaly Alert)</span>
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};

function ZapIcon(props: React.SVGProps<SVGSVGElement>) {
 return (
 <svg
 {...props}
 xmlns="http://www.w3.org/2000/svg"
 width="24"
 height="24"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 strokeLinecap="round"
 strokeLinejoin="round"
 >
 <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
 </svg>
 );
}
