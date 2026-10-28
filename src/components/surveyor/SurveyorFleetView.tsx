import React, { useState } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Phone,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { mockSurveyorProfiles, SurveyorProfile } from '../../data/surveyorData';

interface SurveyorFleetViewProps {
  onSelectCase: (caseId: string) => void;
  onOpenGisMap: () => void;
}

export const SurveyorFleetView: React.FC<SurveyorFleetViewProps> = ({
  onSelectCase,
  onOpenGisMap,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All Branches');
  const [selectedSurveyor, setSelectedSurveyor] = useState<SurveyorProfile>(mockSurveyorProfiles[0]);

  const branches = [
    'All Branches',
    'BAF Jakarta Selatan',
    'BAF Kota Bekasi',
    'BAF Jakarta Barat',
    'BAF Bandung Soekarno-Hatta',
    'BAF Surabaya Timur'
  ];

  const filteredSurveyors = mockSurveyorProfiles.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBranch = selectedBranch === 'All Branches' || s.branch === selectedBranch;
    return matchSearch && matchBranch;
  });

  // Calculate high-level KPIs
  const totalSurveyors = mockSurveyorProfiles.length;
  const totalCompleted = mockSurveyorProfiles.reduce((acc, s) => acc + s.todayCompleted, 0);
  const totalPending = mockSurveyorProfiles.reduce((acc, s) => acc + s.todayPending, 0);
  const totalMockGps = mockSurveyorProfiles.reduce((acc, s) => acc + s.mockGpsFlagsCount, 0);
  const avgSla = (
    mockSurveyorProfiles.reduce((acc, s) => acc + s.slaComplianceRate, 0) / totalSurveyors
  ).toFixed(1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A]">
            Field Surveyor Fleet Performance &amp; SLA Monitoring
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Track visit routes, in-app geotag validation, physical survey radius compliance, and Mock GPS spoofing detection.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGisMap}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#E5E5E3] bg-white text-sm font-medium text-[#1A1A1A] hover:bg-[#F7F7F5] transition-colors"
          >
            <MapPin className="w-4 h-4 text-[#2563EB]" />
            <span>Open GIS Field Map</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl border border-[#E5E5E3] bg-white">
          <div className="text-xs text-[#6B6B6B] flex items-center justify-between">
            <span>Active Surveyors</span>
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-semibold text-[#1A1A1A] mt-2">{totalSurveyors}</div>
          <div className="text-[11px] text-[#16A34A] mt-1">100% CameraX connected</div>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E5E3] bg-white">
          <div className="text-xs text-[#6B6B6B] flex items-center justify-between">
            <span>Surveys Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="text-2xl font-semibold text-[#1A1A1A] mt-2">{totalCompleted}</div>
          <div className="text-[11px] text-[#6B6B6B] mt-1">{totalPending} tasks ongoing</div>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E5E3] bg-white">
          <div className="text-xs text-[#6B6B6B] flex items-center justify-between">
            <span>SLA Compliance Rate</span>
            <Clock className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-semibold text-[#1A1A1A] mt-2">{avgSla}%</div>
          <div className="text-[11px] text-[#16A34A] mt-1">BAF Target &ge;90%</div>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E5E3] bg-white">
          <div className="text-xs text-[#6B6B6B] flex items-center justify-between">
            <span>Fake GPS / Mock Flags</span>
            <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="text-2xl font-semibold text-[#DC2626] mt-2">{totalMockGps}</div>
          <div className="text-[11px] text-[#DC2626] mt-1">Detected in Jaksel &amp; Jakpus</div>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E5E3] bg-white">
          <div className="text-xs text-[#6B6B6B] flex items-center justify-between">
            <span>Avg. Radius Deviation</span>
            <Smartphone className="w-4 h-4 text-[#6B6B6B]" />
          </div>
          <div className="text-2xl font-semibold text-[#1A1A1A] mt-2">124 m</div>
          <div className="text-[11px] text-[#16A34A] mt-1">Within green tolerance zone</div>
        </div>
      </div>

      {/* Main Grid: Surveyor Table + Selected Surveyor Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Table: 7 Cols */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
              <input
                type="text"
                placeholder="Search surveyor by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:border-[#2563EB]"
            >
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Table Container */}
          <div className="rounded-xl border border-[#E5E5E3] bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#F7F7F5] border-b border-[#E5E5E3] text-[#6B6B6B] text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Surveyor</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Today's Progress</th>
                    <th className="py-3 px-4">SLA</th>
                    <th className="py-3 px-4 text-center">Fake GPS</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E3]">
                  {filteredSurveyors.map((s) => {
                    const isSelected = selectedSurveyor.id === s.id;
                    const hasMock = s.mockGpsFlagsCount > 0;

                    return (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedSurveyor(s)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#2563EB]/5 font-medium' : 'hover:bg-[#F7F7F5]'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="text-sm font-semibold text-[#1A1A1A]">{s.name}</div>
                          <div className="text-xs text-[#6B6B6B] font-mono">{s.id}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#1A1A1A]">{s.branch}</td>
                        <td className="py-3 px-4">
                          <div className="text-xs text-[#1A1A1A]">
                            <span className="font-semibold text-[#16A34A]">{s.todayCompleted}</span>{' '}
                            completed · {s.todayPending} active
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs font-mono font-semibold ${
                              s.slaComplianceRate >= 95
                                ? 'text-[#16A34A]'
                                : s.slaComplianceRate >= 90
                                ? 'text-[#D97706]'
                                : 'text-[#DC2626]'
                            }`}
                          >
                            {s.slaComplianceRate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {hasMock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-[#DC2626]/10 text-[#DC2626]">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{s.mockGpsFlagsCount} Alert</span>
                            </span>
                          ) : (
                            <span className="text-xs text-[#16A34A] font-medium">Clean</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <ChevronRight className="w-4 h-4 text-[#6B6B6B] inline-block" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Detail Card: 5 Cols */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl border border-[#E5E5E3] bg-white space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#E5E5E3]">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#2563EB]">
                  Surveyor Profile Details
                </span>
                <h2 className="text-lg font-semibold text-[#1A1A1A] mt-0.5">
                  {selectedSurveyor.name}
                </h2>
                <div className="text-xs text-[#6B6B6B] flex items-center gap-2 mt-1">
                  <span className="font-mono">{selectedSurveyor.id}</span>
                  <span>·</span>
                  <span>{selectedSurveyor.branch}</span>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-2.5 py-1 rounded text-xs font-semibold ${
                    selectedSurveyor.activeStatus === 'on_duty'
                      ? 'bg-amber-50 text-[#D97706] border border-amber-200'
                      : 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                  }`}
                >
                  {selectedSurveyor.activeStatus === 'on_duty' ? 'On Field Duty' : 'Online / Available'}
                </span>
                <div className="text-xs text-[#6B6B6B] mt-1 flex items-center justify-end gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{selectedSurveyor.phone}</span>
                </div>
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] text-center">
              <div>
                <div className="text-[10px] text-[#6B6B6B] uppercase font-semibold">Visit SLA</div>
                <div className="text-base font-bold text-[#1A1A1A] mt-0.5">
                  {selectedSurveyor.slaComplianceRate}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#6B6B6B] uppercase font-semibold">Radius Deviation</div>
                <div className="text-base font-bold text-[#1A1A1A] mt-0.5">
                  {selectedSurveyor.avgDistanceDeviationMeters} m
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#6B6B6B] uppercase font-semibold">Fake GPS Alerts</div>
                <div
                  className={`text-base font-bold mt-0.5 ${
                    selectedSurveyor.mockGpsFlagsCount > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'
                  }`}
                >
                  {selectedSurveyor.mockGpsFlagsCount}
                </div>
              </div>
            </div>

            {/* Warning if FakeGPS detected */}
            {selectedSurveyor.mockGpsFlagsCount > 0 && (
              <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-[#DC2626] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Integrity Violation Alert:</span>
                  <p className="mt-0.5 text-[11px] leading-relaxed">
                    Surveyor device detected running mock location provider (Fake GPS) on applications
                    for Rian Hendrawan (CASE-0941) &amp; Hendra Irawan (CASE-0946). Immediate supervisor
                    field audit recommended.
                  </p>
                </div>
              </div>
            )}

            {/* Today's Schedule & Cases */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2">
                Today's Assigned Cases &amp; Route
              </div>
              <div className="space-y-2">
                {selectedSurveyor.assignedCases.map((c) => (
                  <div
                    key={c.caseId}
                    className="p-3 rounded-lg border border-[#E5E5E3] bg-[#FFFFFF] hover:border-[#2563EB] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                          <span>{c.applicantName}</span>
                          <span className="text-[11px] font-mono text-[#6B6B6B]">({c.caseId})</span>
                        </div>
                        <div className="text-[11px] text-[#2563EB] font-medium mt-0.5">
                          {c.vehicleModel}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono font-medium text-[#6B6B6B] bg-[#F7F7F5] px-1.5 py-0.5 rounded">
                          {c.scheduledTime}
                        </span>
                        <div className="mt-1">
                          {c.status === 'flagged' ? (
                            <span className="text-[10px] font-semibold text-[#DC2626] px-1.5 py-0.5 rounded bg-red-50 border border-red-200">
                              Flagged
                            </span>
                          ) : c.status === 'completed' ? (
                            <span className="text-[10px] font-semibold text-[#16A34A] px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                              Completed
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-[#D97706] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200">
                              Scheduled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#6B6B6B] mt-2 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-[#6B6B6B] shrink-0" />
                      <span className="truncate">{c.targetAddress}</span>
                    </div>

                    {c.distanceMeters !== undefined && (
                      <div className="mt-2 pt-2 border-t border-[#E5E5E3] flex items-center justify-between text-[11px]">
                        <span className="text-[#6B6B6B]">
                          GPS Deviation: <strong className="text-[#1A1A1A]">{c.distanceMeters} m</strong>
                        </span>
                        <button
                          onClick={() => onSelectCase(c.caseId)}
                          className="inline-flex items-center gap-1 text-[#2563EB] hover:underline font-medium"
                        >
                          <span>Review Case</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
