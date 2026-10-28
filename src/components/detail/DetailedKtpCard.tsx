import React from 'react';
import { DocumentVerification } from '../../types';
import { AlertTriangle, CheckCircle2, Copy, Shield, Sparkles } from 'lucide-react';

interface DetailedKtpCardProps {
 document: DocumentVerification;
 customerName: string;
 showTamperOverlay: boolean;
}

export const DetailedKtpCard: React.FC<DetailedKtpCardProps> = ({
 document,
 customerName,
 showTamperOverlay,
}) => {
 const { ocrFields, nikValidation, tamperFlags } = document;
 const isHighRisk = document.score >= 70;

 // Portrait photo: realistic Indonesian passport portrait with official red background
 const portraitUrl =
 document.ktpImageUrl ||
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80';

 return (
 <div className="relative w-full max-w-xl mx-auto rounded-xl shadow-sm border border-[#C5D5E0] bg-[#E3EFF7] overflow-hidden select-none font-sans text-[#1A1A1A]">
 {/* Guilloche Microprint Security Background Pattern */}
 <svg
 className="absolute inset-0 w-full h-full opacity-25 pointer-events-none"
 xmlns="http://www.w3.org/2000/svg"
 >
 <defs>
 <pattern id="guilloche" width="30" height="30" patternUnits="userSpaceOnUse">
 <path
 d="M 0 15 Q 7.5 0 15 15 T 30 15 M 0 30 Q 7.5 15 15 30 T 30 30"
 fill="none"
 stroke="#0284C7"
 strokeWidth="0.5"
 />
 </pattern>
 </defs>
 <rect width="100%" height="100%" fill="url(#guilloche)" />
 {/* Subtle Garuda Watermark Center */}
 <circle cx="50%" cy="50%" r="90" fill="none" stroke="#0284C7" strokeWidth="0.8" opacity="0.4" />
 <circle cx="50%" cy="50%" r="60" fill="none" stroke="#0284C7" strokeWidth="0.8" opacity="0.3" />
 </svg>

 {/* Physical Card Laminate Sheen Effect */}
 <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />

 {/* Card Content Padding */}
 <div className="relative p-4 sm:p-5 flex flex-col justify-between min-h-[300px]">
 {/* e-KTP Official Header */}
 <div className="text-center pb-2 border-b border-[#B8D1E0]">
 <div className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-[#0F3C68]">
 REPUBLIK INDONESIA
 </div>
 <div className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-[#1E293B]">
 PROVINSI {nikValidation.province.split('-')[1]?.trim() || 'JAWA BARAT'}
 </div>
 <div className="text-[9px] sm:text-[10px] font-semibold tracking-wide uppercase text-[#334155]">
 {nikValidation.regency.split('-')[1]?.trim() || 'KOTA BEKASI'}
 </div>
 </div>

 {/* NIK Bar */}
 <div className="my-2 flex items-center justify-between">
 <div className="flex items-baseline gap-2">
 <span className="text-[11px] font-bold text-[#1E293B] tracking-wider">
 NIK
 </span>
 <span className="text-xs font-bold text-[#475569]">:</span>
 <span
 className={` text-sm sm:text-base font-bold tracking-widest tabular-nums ${
 isHighRisk
 ? 'text-[#DC2626] bg-red-100/80 px-1 rounded border border-red-300'
 : 'text-[#0F172A]'
 }`}
 >
 {ocrFields.nik?.value || nikValidation.nik}
 </span>
 </div>

 <div className="flex items-center gap-1.5">
 {/* Holographic Chip Graphic */}
 <div
 className="w-7 h-5 rounded bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 border border-amber-600/50 flex items-center justify-center shadow-xs"
 title="e-KTP Integrated Contactless Chip"
 >
 <div className="w-4 h-3 border border-amber-800/40 rounded-xs grid grid-cols-2 gap-0.5 p-0.5">
 <div className="bg-amber-400/80 rounded-2xs" />
 <div className="bg-amber-400/80 rounded-2xs" />
 </div>
 </div>
 <span className="text-[9px] font-bold text-[#0284C7] bg-white/80 px-1 py-0.5 rounded border border-[#B8D1E0]">
 e-KTP
 </span>
 </div>
 </div>

 {/* Main Body: Demographic Data Left + Passport Photo Right */}
 <div className="grid grid-cols-12 gap-2 my-1">
 {/* Demographic Data Columns (8 cols) */}
 <div className="col-span-8 space-y-0.5 text-[10px] sm:text-[11px] leading-tight text-[#1E293B]">
 {/* Nama */}
 <div className="flex items-baseline">
 <span className="w-24 shrink-0 text-[#475569]">Nama</span>
 <span className="w-2 shrink-0 text-[#64748B]">:</span>
 <span className="font-semibold uppercase truncate text-[#0F172A]">
 {ocrFields.nama?.value || customerName}
 </span>
 </div>

 {/* Tempat/Tgl Lahir */}
 <div className="flex items-baseline">
 <span className="w-24 shrink-0 text-[#475569]">Tempat/Tgl Lahir</span>
 <span className="w-2 shrink-0 text-[#64748B]">:</span>
 <span
 className={`uppercase font-medium ${
 ocrFields.tglLahir?.isAnomaly
 ? 'text-[#DC2626] font-semibold bg-red-100/60 px-0.5 rounded'
 : 'text-[#0F172A]'
 }`}
 >
 {ocrFields.tempatLahir?.value || 'BEKASI'}, {ocrFields.tglLahir?.value || '14-08-1994'}
 </span>
 </div>

 {/* Jenis Kelamin & Gol Darah */}
 <div className="flex items-baseline">
 <span className="w-24 shrink-0 text-[#475569]">Jenis Kelamin</span>
 <span className="w-2 shrink-0 text-[#64748B]">:</span>
 <span className="uppercase text-[#0F172A]">
 {ocrFields.jenisKelamin?.value || 'LAKI-LAKI'}&nbsp;&nbsp;&nbsp;&nbsp;Gol. Darah : O
 </span>
 </div>

 {/* Alamat */}
 <div className="flex items-baseline">
 <span className="w-24 shrink-0 text-[#475569]">Alamat</span>
 <span className="w-2 shrink-0 text-[#64748B]">:</span>
 <span className="uppercase truncate text-[#0F172A]">
 {ocrFields.alamat?.value || 'JL. MELATI NO. 45'}
 </span>
 </div>

 {/* RT/RW */}
 <div className="flex items-baseline pl-4">
 <span className="w-20 shrink-0 text-[#64748B]">RT/RW</span>
 <span className="w-2 shrink-0 text-[#64748B]">:</span>
 <span className=" text-[#0F172A]">004/002</span>
 </div>

 {/* Kel/Desa */}
 <div className="flex items-baseline pl-4">
 <span className="w-20 shrink-0 text-[#64748B]">Kel/Desa</span>
 <span className="w-2 shrink-0 text-[#64748B]">:</span>
 <span className="uppercase text-[#0F172A]">
 {ocrFields.kelDesa?.value || 'KRANJI'}
 </span>
 </div>

 {/* Kecamatan */}
 <div className="flex items-baseline pl-4">
 <span className="w-20 shrink-0 text-[#64748B]">Kecamatan</span>
 <span className="w-2 shrink-0 text-[#64748B]">:</span>
 <span className="uppercase text-[#0F172A]">
 {ocrFields.kecamatan?.value || 'BEKASI BARAT'}
 </span>
 </div>

 {/* Agama */}
 <div className="flex items-baseline">
 <span className="w-24 shrink-0 text-[#475569]">Agama</span>
 <span className="w-2 shrink-0 text-[#64748B]">:</span>
 <span className="uppercase text-[#0F172A]">
 {ocrFields.agama?.value || 'ISLAM'}
 </span>
 </div>

 {/* Status Perkawinan */}
 <div className="flex items-baseline">
 <span className="w-24 shrink-0 text-[#475569]">Status Perkawinan</span>
 <span className="w-2 shrink-0 text-[#64748B]">:</span>
 <span className="uppercase text-[#0F172A]">BELUM KAWIN</span>
 </div>

 {/* Pekerjaan */}
 <div className="flex items-baseline">
 <span className="w-24 shrink-0 text-[#475569]">Pekerjaan</span>
 <span className="w-2 shrink-0 text-[#64748B]">:</span>
 <span className="uppercase text-[#0F172A]">
 {ocrFields.pekerjaan?.value || 'KARYAWAN SWASTA'}
 </span>
 </div>

 {/* Kewarganegaraan */}
 <div className="flex items-baseline">
 <span className="w-24 shrink-0 text-[#475569]">Kewarganegaraan</span>
 <span className="w-2 shrink-0 text-[#64748B]">:</span>
 <span className="uppercase font-semibold text-[#0F172A]">WNI</span>
 </div>

 {/* Berlaku Hingga */}
 <div className="flex items-baseline">
 <span className="w-24 shrink-0 text-[#475569]">Berlaku Hingga</span>
 <span className="w-2 shrink-0 text-[#64748B]">:</span>
 <span className="uppercase font-bold text-[#0F172A]">SEUMUR HIDUP</span>
 </div>
 </div>

 {/* Right Column: Passport Photo & Digital Signature (4 cols) */}
 <div className="col-span-4 flex flex-col items-center justify-between">
 {/* Indonesian Formal Red-Backdrop Passport Photo Box */}
 <div
 className={`relative w-24 sm:w-28 h-32 sm:h-36 rounded-md overflow-hidden border-2 shadow-xs bg-[#B91C1C] flex items-center justify-center ${
 showTamperOverlay && isHighRisk
 ? 'border-[#DC2626] ring-2 ring-[#DC2626]'
 : 'border-[#94A3B8]'
 }`}
 >
 {/* Official Red Backdrop */}
 <img
 src={portraitUrl}
 alt="Pasfoto KTP Pemohon"
 className="w-full h-full object-cover object-top mix-blend-normal"
 onError={(e) => {
 (e.target as HTMLImageElement).src =
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80';
 }}
 />

 {/* Holographic Kemendagri Overlay Seal */}
 <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-300/60 to-amber-200/60 border border-white/50 flex items-center justify-center opacity-85 pointer-events-none">
 <Sparkles className="w-3 h-3 text-white" />
 </div>

 {/* Tamper Warning Overlay on Photo */}
 {showTamperOverlay && isHighRisk && (
 <div className="absolute inset-0 bg-[#DC2626]/30 border-2 border-dashed border-white flex flex-col items-center justify-center p-1 text-center">
 <span className="text-[10px] font-bold text-white bg-[#DC2626] px-1.5 py-0.5 rounded shadow">
 Pixel Boundary Mismatch
 </span>
 <span className="text-[8px] text-white mt-1 drop-shadow">
 Foto Tempelan Terdeteksi
 </span>
 </div>
 )}
 </div>

 {/* Digital Signature & Issuance City */}
 <div className="mt-2 text-center w-full">
 <div className="text-[8px] text-[#475569]">
 KOTA BEKASI, 15-08-2016
 </div>
 {/* Simulated Signature SVG */}
 <div className="h-6 flex items-center justify-center text-[#1E3A8A]">
 <svg width="60" height="20" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2">
 <path d="M 10 20 Q 25 5 40 18 T 65 12 T 90 22" strokeLinecap="round" />
 <path d="M 30 25 Q 50 15 70 24" strokeLinecap="round" />
 </svg>
 </div>
 <div className="text-[8px] text-[#64748B] border-t border-[#B8D1E0] pt-0.5">
 TANDA TANGAN RESMI
 </div>
 </div>
 </div>
 </div>

 {/* Card Footer Bar: Authentic Machine Readable Strip */}
 <div className="pt-1.5 border-t border-[#B8D1E0] flex items-center justify-between text-[8px] text-[#64748B] ">
 <span>KTP-EL · DITJEN DUKCAPIL KEMENDAGRI RI</span>
 <span>ISO/IEC 7810 ID-1 FORMAT</span>
 </div>
 </div>

 {/* Forensic Tamper Callout Badge (If Activated) */}
 {showTamperOverlay && isHighRisk && (
 <div className="p-3 bg-red-50 border-t border-red-200 text-xs text-[#DC2626]">
 <div className="font-semibold flex items-center gap-1.5">
 <AlertTriangle className="w-4 h-4 shrink-0" />
 <span>Hasil Analisis Forensik Dokumen KTP:</span>
 </div>
 <ul className="mt-1.5 space-y-1 text-[11px] list-disc list-inside">
 {tamperFlags.map((flag, idx) => (
 <li key={idx}>{flag}</li>
 ))}
 </ul>
 </div>
 )}
 </div>
 );
};
