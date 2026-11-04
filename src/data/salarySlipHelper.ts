import { SalarySlipBreakdown } from '../types';

export function calculateDsr(monthlyInstallment: number, takeHomePay: number) {
  if (takeHomePay <= 0) {
    return { dsrPercentage: 100, isDsrHealthy: false };
  }
  const dsrPercentage = Number(((monthlyInstallment / takeHomePay) * 100).toFixed(2));
  const isDsrHealthy = dsrPercentage <= 35.0;
  return { dsrPercentage, isDsrHealthy };
}

export const defaultSalarySlip: SalarySlipBreakdown = {
  companyName: 'PT Citra Nusantara Mandiri',
  companyAddress: 'Kawasan Industri Pulogadung, Blok B No. 12, Jakarta Timur',
  employeeName: 'BUDI SANTOSO',
  employeeNik: '3171012305880001',
  period: 'Oktober 2026',
  paymentDate: '25 Oktober 2026',
  earnings: {
    gajiPokok: 5500000,
    tunjanganTransport: 800000,
    tunjanganMakan: 600000,
    tunjanganKehadiran: 400000,
    totalTunjangan: 1800000,
    grossIncome: 7300000,
  },
  deductions: {
    bpjsKesehatan: 73000,
    bpjsKetenagakerjaan: 146000,
    pph21: 231000,
    totalPotongan: 450000,
  },
  takeHomePay: 6850000,
  declaredIncome: 7000000,
  monthlyInstallment: 1850000,
  dsrPercentage: 27.01,
  isDsrHealthy: true,
  stampStatus: 'verified',
  stampNote: 'Stempel Perusahaan Basah Asli & Tanda Tangan Direksi HRD Terverifikasi',
  ocrConfidence: 98,
  slipImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
  anomalies: [],
};
