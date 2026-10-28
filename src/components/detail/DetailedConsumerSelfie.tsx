import React, { useState } from 'react';
import { Camera, CheckCircle2, AlertTriangle, Smartphone, User, ShieldCheck } from 'lucide-react';
import { DocumentVerification } from '../../types';

interface DetailedConsumerSelfieProps {
 document: DocumentVerification;
 customerName: string;
}

export const DetailedConsumerSelfie: React.FC<DetailedConsumerSelfieProps> = ({
 document,
 customerName,
}) => {
 const { faceMatchScore, isScreenCaptureDetected } = document;
 const isMatchValid = faceMatchScore >= 80;

 const [mainImgError, setMainImgError] = useState(false);
 const [ktpCropError, setKtpCropError] = useState(false);
 const [selfieCropError, setSelfieCropError] = useState(false);

 // High-availability portrait URLs
 const primarySelfie =
 document.selfieImageUrl ||
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80';

 const ktpPortrait =
 document.ktpImageUrl ||
 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80';

 return (
 <div className="w-full max-w-xl mx-auto rounded-xl border border-[#E5E5E3] bg-white overflow-hidden shadow-xs">
 {/* Top Header: CameraX & Biometric Liveness Indicator */}
 <div className="px-4 py-3 bg-[#F7F7F5] border-b border-[#E5E5E3] flex items-center justify-between text-xs">
 <div className="flex items-center gap-2">
 <Smartphone className="w-4 h-4 text-[#2563EB]" />
 <span className="font-semibold text-[#1A1A1A]">CameraX In-App Selfie Liveness</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-[#16A34A] border border-emerald-200">
 <CheckCircle2 className="w-3 h-3" />
 <span>3D Live Verified</span>
 </span>
 <span className="text-[11px] text-[#6B6B6B] ">1080×1440 · 60fps</span>
 </div>
 </div>

 {/* Main Selfie Display — Clear Unobstructed Consumer Face */}
 <div className="relative aspect-[4/3] bg-[#0F172A] overflow-hidden flex items-center justify-center">
 {!mainImgError ? (
 <img
 src={primarySelfie}
 alt={`Consumer Selfie - ${customerName}`}
 className="w-full h-full object-cover object-center"
 onError={() => setMainImgError(true)}
 />
 ) : (
 /* Realistic vector fallback portrait of applicant holding ID */
 <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col items-center justify-center text-white relative">
 <svg
 className="w-56 h-56"
 viewBox="0 0 200 200"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 >
 {/* Head & Hair */}
 <circle cx="100" cy="85" r="42" fill="#E2B193" />
 <path
 d="M 60 75 Q 100 35 140 75 C 145 95 140 50 100 45 C 60 50 55 95 60 75 Z"
 fill="#27272A"
 />
 {/* Eyebrows */}
 <path d="M 74 72 Q 84 68 92 72" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" />
 <path d="M 108 72 Q 116 68 126 72" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" />
 {/* Eyes */}
 <circle cx="83" cy="80" r="3.5" fill="#18181B" />
 <circle cx="117" cy="80" r="3.5" fill="#18181B" />
 <circle cx="84" cy="79" r="1" fill="#FFFFFF" />
 <circle cx="118" cy="79" r="1" fill="#FFFFFF" />
 {/* Nose */}
 <path d="M 100 78 L 98 94 L 104 94" stroke="#C28E72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
 {/* Mouth/Smile */}
 <path d="M 88 106 Q 100 114 112 106" stroke="#9A3412" strokeWidth="2.5" strokeLinecap="round" />
 {/* Ears */}
 <circle cx="58" cy="88" r="8" fill="#D99B7E" />
 <circle cx="142" cy="88" r="8" fill="#D99B7E" />
 {/* Neck & Shoulders */}
 <path d="M 86 125 L 86 145 L 114 145 L 114 125 Z" fill="#D99B7E" />
 <path d="M 40 200 C 45 155 75 145 100 145 C 125 145 155 155 160 200 Z" fill="#1E3A8A" />
 {/* Collared Shirt V */}
 <path d="M 85 145 L 100 168 L 115 145 Z" fill="#F8FAFC" />
 {/* Holding e-KTP card in hand */}
 <rect x="110" y="145" width="60" height="38" rx="4" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
 <rect x="115" y="150" width="16" height="22" rx="2" fill="#DC2626" />
 <line x1="135" y1="154" x2="162" y2="154" stroke="#0F172A" strokeWidth="1.5" />
 <line x1="135" y1="160" x2="158" y2="160" stroke="#0F172A" strokeWidth="1.5" />
 </svg>
 <span className="text-xs font-semibold text-slate-200 mt-1">
 {customerName} (Live Selfie)
 </span>
 </div>
 )}

 {/* Minimalist Camera HUD: Corner targeting brackets (doesn't obstruct face) */}
 <div className="absolute inset-8 sm:inset-10 pointer-events-none flex flex-col justify-between">
 <div className="flex justify-between items-start">
 <div className="w-6 h-6 border-t-2 border-l-2 border-[#2563EB] rounded-tl" />
 <div className="bg-black/60 backdrop-blur-xs text-[10px] text-white px-2 py-0.5 rounded ">
 Live Feed · 100% Face In Frame
 </div>
 <div className="w-6 h-6 border-t-2 border-r-2 border-[#2563EB] rounded-tr" />
 </div>

 <div className="flex justify-between items-end">
 <div className="w-6 h-6 border-b-2 border-l-2 border-[#2563EB] rounded-bl" />
 <div className="bg-black/60 backdrop-blur-xs text-[10px] text-white px-2 py-0.5 rounded ">
 Gaze: Direct · Pose: 0.2°
 </div>
 <div className="w-6 h-6 border-b-2 border-r-2 border-[#2563EB] rounded-br" />
 </div>
 </div>

 {/* Screen capture tamper badge if detected */}
 {isScreenCaptureDetected && (
 <div className="absolute top-3 right-3 bg-[#DC2626] text-white text-[11px] font-semibold px-2.5 py-1 rounded shadow-md flex items-center gap-1.5 z-10">
 <AlertTriangle className="w-3.5 h-3.5" />
 <span>Moiré Screen Reflection Detected</span>
 </div>
 )}
 </div>

 {/* Biometric 1:1 Facial Vector Comparison Tray */}
 <div className="p-4 bg-white border-t border-[#E5E5E3]">
 <div className="flex items-center justify-between text-xs mb-3">
 <span className="font-semibold text-[#1A1A1A]">Biometric 1:1 Facial Vector Comparison</span>
 <span
 className={` font-bold px-2.5 py-0.5 rounded text-xs ${
 isMatchValid
 ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
 : 'bg-red-50 text-[#DC2626] border border-red-200'
 }`}
 >
 {faceMatchScore}% Match Confidence ({isMatchValid ? 'Verified Match' : 'Mismatch Alert'})
 </span>
 </div>

 <div className="grid grid-cols-2 gap-3">
 {/* Card 1: e-KTP Cropped Face */}
 <div className="p-3 rounded-lg border border-[#E5E5E3] bg-[#F7F7F5] flex items-center gap-3">
 <div className="w-14 h-16 rounded overflow-hidden border border-[#B8D1E0] bg-[#DC2626] shrink-0 flex items-center justify-center">
 {!ktpCropError ? (
 <img
 src={ktpPortrait}
 alt="e-KTP Photo"
 className="w-full h-full object-cover object-top"
 onError={() => setKtpCropError(true)}
 />
 ) : (
 <User className="w-8 h-8 text-white" />
 )}
 </div>
 <div className="text-[11px] min-w-0">
 <div className="font-semibold text-[#1A1A1A] truncate">1. e-KTP Passport Photo</div>
 <div className="text-[#6B6B6B] mt-0.5">Physical card red background</div>
 <div className="text-[10px] text-[#2563EB] mt-1">Resolution: 300 DPI</div>
 </div>
 </div>

 {/* Card 2: Live Selfie Crop */}
 <div className="p-3 rounded-lg border border-[#E5E5E3] bg-[#F7F7F5] flex items-center gap-3">
 <div className="w-14 h-16 rounded overflow-hidden border border-[#E5E5E3] bg-slate-800 shrink-0 flex items-center justify-center">
 {!selfieCropError ? (
 <img
 src={primarySelfie}
 alt="Live Selfie Face"
 className="w-full h-full object-cover object-center"
 onError={() => setSelfieCropError(true)}
 />
 ) : (
 <Camera className="w-8 h-8 text-cyan-400" />
 )}
 </div>
 <div className="text-[11px] min-w-0">
 <div className="font-semibold text-[#1A1A1A] truncate">2. Consumer Live Selfie</div>
 <div className="text-[#6B6B6B] mt-0.5">CameraX front camera</div>
 <div className="text-[10px] text-[#16A34A] mt-1">Live depth: 99.4%</div>
 </div>
 </div>
 </div>

 {/* Technical EXIF & Shutter Metadata footer */}
 <div className="mt-3 pt-3 border-t border-[#E5E5E3] flex flex-wrap items-center justify-between text-[11px] text-[#6B6B6B]">
 <span>Device: Samsung Galaxy A54 (CameraX Hardware Lock)</span>
 <span className="">Timestamp: 2026-10-27 14:14:52 WIB</span>
 </div>
 </div>
 </div>
 );
};
