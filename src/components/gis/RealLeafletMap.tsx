import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Maximize2 } from 'lucide-react';
import { SurveyorPoint } from '../../types';

interface RealLeafletMapProps {
 points: SurveyorPoint[];
 selectedPoint: SurveyorPoint | null;
 onSelectPoint: (point: SurveyorPoint) => void;
 showSurveyorRoute: boolean;
 onOpenCase: (caseId: string) => void;
 mapHeight?: string;
}

export const RealLeafletMap: React.FC<RealLeafletMapProps> = ({
 points,
 selectedPoint,
 onSelectPoint,
 showSurveyorRoute,
 onOpenCase,
 mapHeight = '520px',
}) => {
 const mapContainerRef = useRef<HTMLDivElement>(null);
 const mapInstanceRef = useRef<L.Map | null>(null);
 const markersLayerRef = useRef<L.LayerGroup | null>(null);
 const routesLayerRef = useRef<L.LayerGroup | null>(null);

 // Initialize Leaflet map with standard OpenStreetMap
 useEffect(() => {
 if (!mapContainerRef.current) return;
 if (mapInstanceRef.current) return;

 // Jakarta Metropolitan center
 const map = L.map(mapContainerRef.current, {
 center: [-6.2297, 106.8295],
 zoom: 11,
 zoomControl: false,
 attributionControl: true,
 });

 // Standard OpenStreetMap tiles (Real Map)
 const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
 attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
 maxZoom: 19,
 });
 osmLayer.addTo(map);

 // Zoom control at bottom right
 L.control.zoom({ position: 'bottomright' }).addTo(map);

 // Layer groups for markers & routes
 const markersLayer = L.layerGroup().addTo(map);
 const routesLayer = L.layerGroup().addTo(map);

 mapInstanceRef.current = map;
 markersLayerRef.current = markersLayer;
 routesLayerRef.current = routesLayer;

 // Trigger map resize check
 setTimeout(() => {
 map.invalidateSize();
 }, 250);

 return () => {
 map.remove();
 mapInstanceRef.current = null;
 };
 }, []);

 // Quick jump to region
 const handleFlyToRegion = (lat: number, lng: number, zoom = 12) => {
 const map = mapInstanceRef.current;
 if (!map) return;
 map.flyTo([lat, lng], zoom, { duration: 1.2 });
 };

 const handleFitAll = () => {
 const map = mapInstanceRef.current;
 if (!map || points.length === 0) return;
 const group = L.featureGroup(points.map((p) => L.marker([p.surveyLat, p.surveyLng])));
 map.fitBounds(group.getBounds().pad(0.15), { duration: 1.0 });
 };

 // Update markers and route lines when points, selectedPoint or route toggle change
 useEffect(() => {
 const map = mapInstanceRef.current;
 const markersLayer = markersLayerRef.current;
 const routesLayer = routesLayerRef.current;

 if (!map || !markersLayer || !routesLayer) return;

 markersLayer.clearLayers();
 routesLayer.clearLayers();

 if (points.length === 0) return;

 // Custom Marker Icons creator
 const createMarkerIcon = (status: 'green' | 'yellow' | 'red', isSelected: boolean) => {
 const color =
 status === 'green' ? '#16A34A' : status === 'yellow' ? '#D97706' : '#DC2626';
 const size = isSelected ? 36 : 28;

 return L.divIcon({
 className: 'custom-leaflet-marker',
 iconSize: [size, size],
 iconAnchor: [size / 2, size / 2],
 popupAnchor: [0, -size / 2],
 html: `
 <div style="
 width: ${size}px;
 height: ${size}px;
 background-color: ${color};
 border: 2px solid #FFFFFF;
 border-radius: 50%;
 display: flex;
 align-items: center;
 justify-content: center;
 box-shadow: 0 2px 6px rgba(0,0,0,0.3);
 color: #FFFFFF;
 cursor: pointer;
 outline: ${isSelected ? `3px solid ${color}` : 'none'};
 outline-offset: 2px;
 transition: transform 0.15s ease;
 ">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
 <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
 <circle cx="12" cy="10" r="3"/>
 </svg>
 </div>
 `,
 });
 };

 // Render points
 points.forEach((pt) => {
 const isSelected = selectedPoint?.id === pt.id;
 const marker = L.marker([pt.surveyLat, pt.surveyLng], {
 icon: createMarkerIcon(pt.status, isSelected),
 zIndexOffset: isSelected ? 1000 : 100,
 });

 // Compliance circle (200m buffer)
 const circleColor =
 pt.status === 'green' ? '#16A34A' : pt.status === 'yellow' ? '#D97706' : '#DC2626';

 const circle = L.circle([pt.targetLat, pt.targetLng], {
 radius: 200,
 color: circleColor,
 weight: 1.5,
 fillColor: circleColor,
 fillOpacity: 0.15,
 dashArray: pt.status === 'green' ? undefined : '4, 4',
 });
 markersLayer.addLayer(circle);

 // Connecting line between target address and actual survey position
 if (pt.distanceMeters > 30) {
 const distLine = L.polyline(
 [
 [pt.targetLat, pt.targetLng],
 [pt.surveyLat, pt.surveyLng],
 ],
 {
 color: circleColor,
 weight: 2,
 dashArray: '3, 4',
 }
 );
 markersLayer.addLayer(distLine);
 }

 // Popup Content in English
 const popupHtml = `
 <div style="font-family: Inter, sans-serif; min-width: 220px; padding: 2px;">
 <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid #E5E5E3; padding-bottom: 6px; margin-bottom: 8px;">
 <span style="font-weight: 600; font-size: 13px; color: #1A1A1A;">${pt.applicantName}</span>
 <span style="font-size: 10px; font-weight: 600; color: ${circleColor}; background: #F7F7F5; padding: 2px 6px; border-radius: 4px; border: 1px solid #E5E5E3;">
 ${pt.status === 'green' ? 'Valid (≤200m)' : pt.status === 'yellow' ? 'Warning Zone' : 'GPS Anomaly'}
 </span>
 </div>
 <div style="font-size: 11px; color: #6B6B6B; line-height: 1.6;">
 <div><strong>Branch:</strong> ${pt.branch}</div>
 <div><strong>Surveyor:</strong> ${pt.surveyorName}</div>
 <div><strong>Vehicle:</strong> ${pt.vehicleModel}</div>
 <div><strong>Deviation:</strong> ${pt.distanceMeters} m</div>
 <div><strong>Survey Time:</strong> ${pt.surveyTime}</div>
 ${pt.isMockLocation ? '<div style="color: #DC2626; font-weight: 600; margin-top: 4px;">⚠️ Mock Location Provider Detected</div>' : ''}
 </div>
 <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #E5E5E3; text-align: right;">
 <button id="btn-case-${pt.id}" style="background-color: #2563EB; color: #FFFFFF; font-size: 11px; font-weight: 500; border: none; border-radius: 6px; padding: 5px 12px; cursor: pointer;">
 Open Case (${pt.caseId}) &rarr;
 </button>
 </div>
 </div>
 `;

 marker.bindPopup(popupHtml);

 marker.on('click', () => {
 onSelectPoint(pt);
 });

 marker.on('popupopen', () => {
 setTimeout(() => {
 const btn = document.getElementById(`btn-case-${pt.id}`);
 if (btn) {
 btn.onclick = () => onOpenCase(pt.caseId);
 }
 }, 50);
 });

 markersLayer.addLayer(marker);
 });

 // Surveyor Route lines
 if (showSurveyorRoute) {
 const surveyorGroups: Record<string, SurveyorPoint[]> = {};
 points.forEach((p) => {
 if (!surveyorGroups[p.surveyorName]) surveyorGroups[p.surveyorName] = [];
 surveyorGroups[p.surveyorName].push(p);
 });

 Object.entries(surveyorGroups).forEach(([surveyorName, sPoints]) => {
 if (sPoints.length < 2) return;
 const latLngs = sPoints.map((p) => [p.surveyLat, p.surveyLng] as [number, number]);
 const routeColor = surveyorName.includes('Bambang') ? '#2563EB' : '#16A34A';

 const poly = L.polyline(latLngs, {
 color: routeColor,
 weight: 3,
 dashArray: '6, 6',
 opacity: 0.85,
 });

 routesLayer.addLayer(poly);
 });
 }

 // Auto fit bounds if no point is explicitly selected
 if (points.length > 0 && !selectedPoint) {
 const group = L.featureGroup(
 points.map((p) => L.marker([p.surveyLat, p.surveyLng]))
 );
 map.fitBounds(group.getBounds().pad(0.15));
 }
 }, [points, selectedPoint, showSurveyorRoute, onSelectPoint, onOpenCase]);

 // Center on selected point when it changes
 useEffect(() => {
 const map = mapInstanceRef.current;
 if (!map || !selectedPoint) return;

 map.flyTo([selectedPoint.surveyLat, selectedPoint.surveyLng], 14, {
 duration: 1.2,
 });
 }, [selectedPoint]);

 return (
 <div className="relative w-full rounded-xl overflow-hidden border border-[#E5E5E3] bg-[#F7F7F5]">
 {/* Top Map Controls Overlay: Regional Jumps & Viewport Fit */}
 <div className="absolute top-3 left-3 z-[400] flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-[#E5E5E3] rounded-lg p-1 shadow-xs text-xs text-[#6B6B6B]">
 <span className="px-2 text-[11px] font-medium text-[#6B6B6B]">Focus:</span>
 <button
 onClick={() => handleFlyToRegion(-6.2297, 106.8295, 12)}
 className="px-2.5 py-1 rounded hover:bg-[#F7F7F5] hover:text-[#1A1A1A] transition-colors font-medium"
 >
 Greater Jakarta
 </button>
 <button
 onClick={() => handleFlyToRegion(-6.9175, 107.6191, 12)}
 className="px-2.5 py-1 rounded hover:bg-[#F7F7F5] hover:text-[#1A1A1A] transition-colors font-medium"
 >
 Bandung
 </button>
 <button
 onClick={() => handleFlyToRegion(-7.2575, 112.7521, 12)}
 className="px-2.5 py-1 rounded hover:bg-[#F7F7F5] hover:text-[#1A1A1A] transition-colors font-medium"
 >
 Surabaya
 </button>
 <button
 onClick={handleFitAll}
 className="px-2.5 py-1 rounded text-[#2563EB] font-medium hover:bg-[#2563EB]/10 transition-colors flex items-center gap-1"
 title="Reset viewport to include all points"
 >
 <Maximize2 className="w-3 h-3" />
 <span>Fit All</span>
 </button>
 </div>

 {/* Leaflet DOM container */}
 <div
 ref={mapContainerRef}
 style={{ height: mapHeight, width: '100%' }}
 className="z-0"
 />
 </div>
 );
};
