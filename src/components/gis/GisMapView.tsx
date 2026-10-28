import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Filter,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Route,
  Building,
  Info
} from 'lucide-react';
import { SurveyorPoint } from '../../types';
import { mockSurveyPoints, branchList } from '../../data/mockData';
import { RealLeafletMap } from './RealLeafletMap';

interface GisMapViewProps {
  onSelectCase: (caseId: string) => void;
}

export const GisMapView: React.FC<GisMapViewProps> = ({ onSelectCase }) => {
  const [selectedBranch, setSelectedBranch] = useState<string>('All Branches');
  const [statusFilter, setStatusFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all');
  const [selectedPoint, setSelectedPoint] = useState<SurveyorPoint | null>(mockSurveyPoints[0]);
  const [showSurveyorRoute, setShowSurveyorRoute] = useState(true);

  // Filter points
  const filteredPoints = mockSurveyPoints.filter((pt) => {
    const matchesBranch = selectedBranch === 'All Branches' || pt.branch === selectedBranch;
    const matchesStatus = statusFilter === 'all' || pt.status === statusFilter;
    return matchesBranch && matchesStatus;
  });

  // Calculate stats
  const greenCount = mockSurveyPoints.filter((p) => p.status === 'green').length;
  const yellowCount = mockSurveyPoints.filter((p) => p.status === 'yellow').length;
  const redCount = mockSurveyPoints.filter((p) => p.status === 'red').length;

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-xl font-semibold text-[#1A1A1A]">
            Geospatial Survey &amp; Field Routes (GIS)
          </h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Real interactive map of survey check-in coordinates, address radius compliance, and mock GPS alerts across BAF branches.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowSurveyorRoute(!showSurveyorRoute)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
              showSurveyorRoute
                ? 'bg-[#2563EB] text-white border-[#2563EB]'
                : 'bg-white text-[#1A1A1A] border-[#E5E5E3] hover:bg-[#F7F7F5]'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span>{showSurveyorRoute ? 'Hide Surveyor Route' : 'Show Surveyor Route'}</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#6B6B6B] font-medium">Branch:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg px-2.5 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#2563EB]"
            >
              {branchList.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#F7F7F5] p-1 rounded-lg border border-[#E5E5E3] text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-[#1A1A1A] font-medium shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              All ({mockSurveyPoints.length})
            </button>
            <button
              onClick={() => setStatusFilter('green')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                statusFilter === 'green'
                  ? 'bg-white text-[#16A34A] font-medium shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#16A34A]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              <span>≤200m Valid ({greenCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('yellow')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                statusFilter === 'yellow'
                  ? 'bg-white text-[#D97706] font-medium shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#D97706]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
              <span>201m-1km ({yellowCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('red')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                statusFilter === 'red'
                  ? 'bg-white text-[#DC2626] font-medium shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#DC2626]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
              <span>&gt;1km / Mock ({redCount})</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-[#6B6B6B]">
          <span>{filteredPoints.length} field survey coordinates</span>
        </div>
      </div>

      {/* Map Layout: Real World GIS Map + Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Map Viewport (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-[#E5E5E3] rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-[#E5E5E3] flex items-center justify-between text-xs bg-[#F7F7F5]">
            <div className="flex items-center gap-2 text-[#1A1A1A] font-medium">
              <Compass className="w-4 h-4 text-[#2563EB]" />
              <span>Real World GIS Map (Indonesia BAF Operations)</span>
            </div>
            <div className="flex items-center gap-4 text-[#6B6B6B]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                <span>Compliant Radius</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                <span>Warning Zone</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                <span>Mock GPS Alert</span>
              </span>
            </div>
          </div>

          {/* Real Leaflet Map Container */}
          <div className="p-3">
            <RealLeafletMap
              points={filteredPoints}
              selectedPoint={selectedPoint}
              onSelectPoint={setSelectedPoint}
              showSurveyorRoute={showSurveyorRoute}
              onOpenCase={onSelectCase}
              mapHeight="520px"
            />
          </div>
        </div>

        {/* Right Inspector Drawer (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {selectedPoint ? (
            <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#6B6B6B]">
                    Survey Check-in Details
                  </span>
                  <h4 className="text-base font-semibold text-[#1A1A1A]">
                    {selectedPoint.applicantName}
                  </h4>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    selectedPoint.status === 'green'
                      ? 'text-[#16A34A]'
                      : selectedPoint.status === 'yellow'
                      ? 'text-[#D97706]'
                      : 'text-[#DC2626]'
                  }`}
                >
                  {selectedPoint.status === 'green'
                    ? 'Verified Normal'
                    : selectedPoint.status === 'yellow'
                    ? 'Warning Zone'
                    : 'Location Anomaly'}
                </span>
              </div>

              {/* Data attributes list */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#E5E5E3]">
                  <span className="text-[#6B6B6B]">Vehicle Model:</span>
                  <span className="font-medium text-[#1A1A1A]">{selectedPoint.vehicleModel}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E5E5E3]">
                  <span className="text-[#6B6B6B]">BAF Branch:</span>
                  <span className="font-medium text-[#1A1A1A]">{selectedPoint.branch}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E5E5E3]">
                  <span className="text-[#6B6B6B]">Assigned Surveyor:</span>
                  <span className="font-medium text-[#1A1A1A]">{selectedPoint.surveyorName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E5E5E3]">
                  <span className="text-[#6B6B6B]">Check-in Timestamp:</span>
                  <span className="font-mono text-[#1A1A1A]">{selectedPoint.surveyTime}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E5E5E3]">
                  <span className="text-[#6B6B6B]">Distance to KTP Address:</span>
                  <span
                    className={`font-mono font-semibold tabular-nums ${
                      selectedPoint.status === 'green'
                        ? 'text-[#16A34A]'
                        : selectedPoint.status === 'yellow'
                        ? 'text-[#D97706]'
                        : 'text-[#DC2626]'
                    }`}
                  >
                    {selectedPoint.distanceMeters} meters
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E5E5E3]">
                  <span className="text-[#6B6B6B]">Mock GPS Status:</span>
                  <span
                    className={`font-semibold ${
                      selectedPoint.isMockLocation ? 'text-[#DC2626]' : 'text-[#16A34A]'
                    }`}
                  >
                    {selectedPoint.isMockLocation ? 'Mocking Alert Detected' : 'Authentic GPS (Valid)'}
                  </span>
                </div>
              </div>

              {/* Anomaly Callout if flagged */}
              {selectedPoint.isMockLocation && (
                <div className="p-3 rounded-lg bg-[#DC2626]/5 border border-[#DC2626]/20 text-xs text-[#DC2626]">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Location Fraud Warning</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    Surveyor hardware reported mock location provider activity (FakeGPS app package detected).
                  </p>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => onSelectCase(selectedPoint.caseId)}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Full Case Audit ({selectedPoint.caseId})</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E5E5E3] rounded-xl p-6 text-center text-xs text-[#6B6B6B]">
              Click on any pin on the map to inspect survey geotag records.
            </div>
          )}

          {/* Surveyor Performance Card */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 text-xs space-y-3">
            <h5 className="font-semibold text-[#1A1A1A]">
              Surveyor Activity Today
            </h5>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] flex justify-between items-center">
                <div>
                  <div className="font-medium text-[#1A1A1A]">Bambang Sudirgo</div>
                  <div className="text-[11px] text-[#6B6B6B]">Jakarta South Branch · 4 Visits</div>
                </div>
                <span className="text-[#DC2626] font-semibold text-[11px]">
                  1 Mock Anomaly
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] flex justify-between items-center">
                <div>
                  <div className="font-medium text-[#1A1A1A]">Agus Setiawan</div>
                  <div className="text-[11px] text-[#6B6B6B]">Bekasi Branch · 3 Visits</div>
                </div>
                <span className="text-[#16A34A] font-semibold text-[11px]">
                  100% Compliant
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] flex justify-between items-center">
                <div>
                  <div className="font-medium text-[#1A1A1A]">Dimas Wicaksono</div>
                  <div className="text-[11px] text-[#6B6B6B]">Surabaya Branch · 2 Visits</div>
                </div>
                <span className="text-[#D97706] font-semibold text-[11px]">
                  1 Re-survey Needed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
