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
  Sparkles
} from 'lucide-react';
import { FinancingCase } from '../../../types';
import { RealCaseMiniMap } from '../RealCaseMiniMap';

interface CaseGeoPageProps {
  caseData: FinancingCase;
}

export const CaseGeoPage: React.FC<CaseGeoPageProps> = ({ caseData }) => {
  const { geo, customerName } = caseData;
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const selectedPhoto = geo.surveyPhotos[selectedPhotoIndex] || geo.surveyPhotos[0];

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
              className={`text-base font-bold font-mono ${
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
              <div className="flex items-center gap-2 text-[11px] font-mono">
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
              <div className="text-right sm:shrink-0 font-mono text-[11px] text-[#6B6B6B]">
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
              <span className="text-[10px] font-mono text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded font-semibold">
                SLA: 24 Mins (On-Target)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
                <div className="text-[10px] text-[#6B6B6B]">Surveyor Name</div>
                <div className="font-semibold text-[#1A1A1A] mt-0.5">{geo.surveyorName}</div>
                <div className="text-[10px] text-[#6B6B6B] font-mono">ID: {geo.surveyorId}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
                <div className="text-[10px] text-[#6B6B6B]">Visit Timestamp</div>
                <div className="font-semibold text-[#1A1A1A] mt-0.5">{geo.surveyTimestamp.split(' ')[1]} WIB</div>
                <div className="text-[10px] text-[#6B6B6B] font-mono">{geo.surveyTimestamp.split(' ')[0]}</div>
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
                <span className={`font-mono font-semibold ${geo.isMockLocationDetected ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                  {geo.isMockLocationDetected ? 'TRUE (Active)' : 'FALSE (Genuine)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#6B6B6B] pb-1.5 border-b border-[#E5E5E3]">
                <span>Mock Provider Package:</span>
                <span className={`font-mono ${geo.isMockLocationDetected ? 'text-[#DC2626] font-semibold' : 'text-[#16A34A]'}`}>
                  {geo.isMockLocationDetected ? (geo.mockLocationReason || 'com.lexa.fakegps') : 'None (No fake GPS apps)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#6B6B6B] pb-1.5 border-b border-[#E5E5E3]">
                <span>GPS Horizontal Accuracy:</span>
                <span className="font-mono text-[#1A1A1A] font-semibold">± 4.8 meters</span>
              </div>
              <div className="flex items-center justify-between text-[#6B6B6B] pb-1.5 border-b border-[#E5E5E3]">
                <span>GPS Satellite Constellation:</span>
                <span className="font-mono text-[#1A1A1A]">14 Satellites (GLONASS + GPS)</span>
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
              <span className="text-[11px] text-[#6B6B6B] font-mono">
                {geo.surveyPhotos.length} Captured Images
              </span>
            </div>

            {/* Photo Preview Canvas */}
            <div className="space-y-3">
              <div className="relative aspect-4/3 rounded-lg overflow-hidden border border-[#E5E5E3] bg-[#1A1A1A] flex flex-col justify-between p-3 text-white">
                <div className="flex items-center justify-between text-[10px] font-mono z-10 bg-black/60 backdrop-blur-xs px-2 py-1 rounded">
                  <span className="flex items-center gap-1">
                    <Camera className="w-3 h-3 text-[#16A34A]" />
                    <span>CameraX In-App Verified</span>
                  </span>
                  <span className="text-cyan-300">BAF Surveyor Mobile</span>
                </div>

                <div className="text-center my-auto opacity-75">
                  <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center mx-auto mb-1 bg-white/10">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xs font-semibold">{selectedPhoto.caption}</div>
                  <div className="text-[10px] font-mono text-white/70 uppercase">
                    TYPE: {selectedPhoto.photoType}
                  </div>
                </div>

                <div className="z-10 bg-black/75 backdrop-blur-xs p-2 rounded text-[10px] space-y-0.5 border border-white/10 font-mono">
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
                    <span className="text-gray-400">HARDWARE LOCK:</span>
                    <span className="text-emerald-400">In-App CameraX (No Gallery)</span>
                  </div>
                </div>
              </div>

              {/* Thumbnail Selector */}
              <div className="grid grid-cols-3 gap-2">
                {geo.surveyPhotos.map((photo, idx) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`p-2 rounded-lg text-left text-xs border transition-all ${
                      selectedPhotoIndex === idx
                        ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#1A1A1A] font-semibold'
                        : 'border-[#E5E5E3] hover:bg-[#F7F7F5] text-[#6B6B6B]'
                    }`}
                  >
                    <div className="font-medium text-[11px] truncate">{photo.caption}</div>
                    <div className="text-[10px] text-[#6B6B6B] font-mono mt-0.5">
                      {photo.timestamp.split(' ')[1]} WIB
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
