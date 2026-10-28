import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GeoSurvey } from '../../types';

interface RealCaseMiniMapProps {
 geo: GeoSurvey;
 customerName: string;
 height?: string;
}

export const RealCaseMiniMap: React.FC<RealCaseMiniMapProps> = ({
 geo,
 customerName,
 height = '320px',
}) => {
 const mapContainerRef = useRef<HTMLDivElement>(null);
 const mapInstanceRef = useRef<L.Map | null>(null);

 useEffect(() => {
 if (!mapContainerRef.current) return;
 if (mapInstanceRef.current) return;

 const targetLat = geo.targetLat;
 const targetLng = geo.targetLng;
 const surveyLat = geo.surveyLat;
 const surveyLng = geo.surveyLng;

 // Center between target and survey
 const centerLat = (targetLat + surveyLat) / 2;
 const centerLng = (targetLng + surveyLng) / 2;

 const map = L.map(mapContainerRef.current, {
 center: [centerLat, centerLng],
 zoom: 15,
 zoomControl: false,
 attributionControl: true,
 });

 // Real world OpenStreetMap tiles
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
 attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
 maxZoom: 19,
 }).addTo(map);

 L.control.zoom({ position: 'bottomright' }).addTo(map);

 // 200-meter compliance circle around target address
 const circleColor =
 geo.distanceStatus === 'green'
 ? '#16A34A'
 : geo.distanceStatus === 'yellow'
 ? '#D97706'
 : '#DC2626';

 const circle = L.circle([targetLat, targetLng], {
 radius: 200,
 color: '#16A34A',
 fillColor: '#16A34A',
 fillOpacity: 0.12,
 weight: 1.5,
 }).addTo(map);
 circle.bindTooltip('Batas Kepatuhan Radius 200m (Zona Hijau)', {
 permanent: false,
 direction: 'top',
 });

 // Target Address Pin (Blue House Icon)
 const targetIcon = L.divIcon({
 className: 'target-pin',
 iconSize: [32, 32],
 iconAnchor: [16, 32],
 popupAnchor: [0, -32],
 html: `
 <div style="
 width: 32px;
 height: 32px;
 background: #2563EB;
 border-radius: 50% 50% 50% 0;
 transform: rotate(-45deg);
 border: 2px solid #FFFFFF;
 display: flex;
 align-items: center;
 justify-content: center;
 box-shadow: 0 2px 6px rgba(0,0,0,0.3);
 ">
 <svg style="transform: rotate(45deg); color: #FFFFFF;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
 <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
 <polyline points="9 22 9 12 15 12 15 22"/>
 </svg>
 </div>
 `,
 });

 const targetMarker = L.marker([targetLat, targetLng], {
 icon: targetIcon,
 }).addTo(map);
 targetMarker.bindPopup(`
 <div style="font-family: Inter, sans-serif; font-size: 12px; padding: 2px;">
 <div style="font-weight: 600; color: #1A1A1A; margin-bottom: 4px;">Titik Alamat Pemohon:</div>
 <div style="color: #6B6B6B;">${geo.targetAddress}</div>
 <div style="font-family: monospace; font-size: 11px; margin-top: 4px; color: #2563EB;">
 ${targetLat.toFixed(6)}, ${targetLng.toFixed(6)}
 </div>
 </div>
 `);

 // Actual Survey Pin (Green / Yellow / Red Surveyor Icon)
 const surveyIcon = L.divIcon({
 className: 'survey-pin',
 iconSize: [32, 32],
 iconAnchor: [16, 16],
 popupAnchor: [0, -16],
 html: `
 <div style="
 width: 32px;
 height: 32px;
 background: ${circleColor};
 border-radius: 50%;
 border: 2px solid #FFFFFF;
 display: flex;
 align-items: center;
 justify-content: center;
 box-shadow: 0 2px 6px rgba(0,0,0,0.3);
 color: #FFFFFF;
 ">
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
 <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.4 7.6 11.9a1 1 0 0 0 1.2 0C13.4 21.4 20.4 15.4 20.4 10A8 8 0 0 0 12 2Z"/>
 <circle cx="12" cy="10" r="3"/>
 </svg>
 </div>
 `,
 });

 const surveyMarker = L.marker([surveyLat, surveyLng], {
 icon: surveyIcon,
 }).addTo(map);
 surveyMarker.bindPopup(`
 <div style="font-family: Inter, sans-serif; font-size: 12px; padding: 2px;">
 <div style="font-weight: 600; color: #1A1A1A; margin-bottom: 4px;">Check-In Fisik Surveyor:</div>
 <div style="color: #6B6B6B;">Surveyor: <strong>${geo.surveyorName}</strong> (${geo.surveyTimestamp})</div>
 <div style="color: #6B6B6B;">Jarak ke Alamat: <strong>${geo.distanceMeters} meter</strong></div>
 ${geo.isMockLocationDetected ? '<div style="color: #DC2626; font-weight: 600; margin-top: 4px;">⚠️ Mock Location Provider Aktif</div>' : ''}
 <div style="font-family: monospace; font-size: 11px; margin-top: 4px; color: ${circleColor};">
 ${surveyLat.toFixed(6)}, ${surveyLng.toFixed(6)}
 </div>
 </div>
 `);

 // Geodesic line between target and survey
 L.polyline(
 [
 [targetLat, targetLng],
 [surveyLat, surveyLng],
 ],
 {
 color: circleColor,
 weight: 2,
 dashArray: '4, 4',
 }
 ).addTo(map);

 // Fit bounds to show both pins comfortably
 const bounds = L.latLngBounds([
 [targetLat, targetLng],
 [surveyLat, surveyLng],
 ]);
 map.fitBounds(bounds.pad(0.35));

 mapInstanceRef.current = map;

 setTimeout(() => {
 map.invalidateSize();
 }, 200);

 return () => {
 map.remove();
 mapInstanceRef.current = null;
 };
 }, [geo]);

 return (
 <div className="relative w-full rounded-xl overflow-hidden border border-[#E5E5E3] bg-[#F7F7F5]">
 <div
 ref={mapContainerRef}
 style={{ height, width: '100%' }}
 className="z-0"
 />
 </div>
 );
};
