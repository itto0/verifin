export interface SurveyorProfile {
 id: string;
 name: string;
 branch: string;
 phone: string;
 activeStatus: 'active' | 'on_duty' | 'offline';
 todayCompleted: number;
 todayPending: number;
 slaComplianceRate: number; // percentage e.g. 96.5
 mockGpsFlagsCount: number;
 avgDistanceDeviationMeters: number;
 rating: number; // e.g. 4.8
 assignedCases: {
 caseId: string;
 applicantName: string;
 vehicleModel: string;
 targetAddress: string;
 status: 'completed' | 'in_progress' | 'flagged' | 'scheduled';
 scheduledTime: string;
 distanceMeters?: number;
 hasMockLocation?: boolean;
 }[];
}

export const mockSurveyorProfiles: SurveyorProfile[] = [
 {
 id: 'SRV-JKT-104',
 name: 'Bambang Sudirgo',
 branch: 'BAF Jakarta Selatan',
 phone: '0812-9844-1120',
 activeStatus: 'on_duty',
 todayCompleted: 4,
 todayPending: 2,
 slaComplianceRate: 88.0,
 mockGpsFlagsCount: 3,
 avgDistanceDeviationMeters: 840,
 rating: 3.9,
 assignedCases: [
 {
 caseId: 'CASE-0941',
 applicantName: 'Rian Hendrawan',
 vehicleModel: 'Yamaha All New NMAX 155',
 targetAddress: 'Jl. Melati No. 45 RT 004 RW 002, Kranji, Bekasi Barat',
 status: 'flagged',
 scheduledTime: '11:00 WIB',
 distanceMeters: 1420,
 hasMockLocation: true,
 },
 {
 caseId: 'CASE-0946',
 applicantName: 'Hendra Irawan',
 vehicleModel: 'Yamaha All New NMAX 155',
 targetAddress: 'Jl. Kebon Sirih No. 15, Gambir, Jakarta Pusat',
 status: 'flagged',
 scheduledTime: '08:30 WIB',
 distanceMeters: 2150,
 hasMockLocation: true,
 },
 {
 caseId: 'CASE-0949',
 applicantName: 'Doni Saputra',
 vehicleModel: 'Yamaha Aerox 155 CyberCity',
 targetAddress: 'Jl. Boulevard BSD No. 9, Serpong, Tangerang',
 status: 'completed',
 scheduledTime: '14:20 WIB',
 distanceMeters: 1850,
 hasMockLocation: true,
 },
 {
 caseId: 'CASE-0955',
 applicantName: 'Fajar Nugraha',
 vehicleModel: 'Yamaha Fazzio Lux',
 targetAddress: 'Jl. Cilandak KKO No. 34, Pasar Minggu, Jakarta Selatan',
 status: 'scheduled',
 scheduledTime: '16:00 WIB',
 }
 ],
 },
 {
 id: 'SRV-BKS-019',
 name: 'Agus Setiawan',
 branch: 'BAF Kota Bekasi',
 phone: '0813-8877-2234',
 activeStatus: 'active',
 todayCompleted: 6,
 todayPending: 1,
 slaComplianceRate: 98.4,
 mockGpsFlagsCount: 0,
 avgDistanceDeviationMeters: 38,
 rating: 4.9,
 assignedCases: [
 {
 caseId: 'CASE-0942',
 applicantName: 'Siti Rahmawati',
 vehicleModel: 'Yamaha Fazzio Hybrid Lux',
 targetAddress: 'Jl. Kartini No. 18 RT 002 RW 005, Margahayu, Bekasi Timur',
 status: 'completed',
 scheduledTime: '10:15 WIB',
 distanceMeters: 34,
 hasMockLocation: false,
 },
 {
 caseId: 'CASE-0948',
 applicantName: 'Yuliana Safitri',
 vehicleModel: 'Yamaha Fazzio Neo',
 targetAddress: 'Jl. Margonda Raya No. 102, Beji, Depok',
 status: 'completed',
 scheduledTime: '13:00 WIB',
 distanceMeters: 410,
 hasMockLocation: false,
 },
 {
 caseId: 'CASE-0956',
 applicantName: 'Rudi Hermawan',
 vehicleModel: 'Yamaha NMAX 155 Neo',
 targetAddress: 'Jl. Cut Meutia No. 14, Sepanjang Jaya, Rawalumbu, Bekasi',
 status: 'in_progress',
 scheduledTime: '15:30 WIB',
 }
 ],
 },
 {
 id: 'SRV-JKT-088',
 name: 'Rahmat Hidayat',
 branch: 'BAF Jakarta Barat',
 phone: '0818-7711-9900',
 activeStatus: 'active',
 todayCompleted: 5,
 todayPending: 2,
 slaComplianceRate: 94.2,
 mockGpsFlagsCount: 0,
 avgDistanceDeviationMeters: 180,
 rating: 4.7,
 assignedCases: [
 {
 caseId: 'CASE-0943',
 applicantName: 'Bagus Prasetyo',
 vehicleModel: 'Yamaha All New Aerox 155',
 targetAddress: 'Jl. Kebon Jeruk Raya No. 12 RT 003 RW 008, Jakarta Barat',
 status: 'completed',
 scheduledTime: '10:45 WIB',
 distanceMeters: 430,
 hasMockLocation: false,
 },
 {
 caseId: 'CASE-0957',
 applicantName: 'Haryanto Wijaya',
 vehicleModel: 'Yamaha XMAX 250 Connected',
 targetAddress: 'Jl. Panjang No. 55, Kebon Jeruk, Jakarta Barat',
 status: 'in_progress',
 scheduledTime: '14:00 WIB',
 }
 ],
 },
 {
 id: 'SRV-BDG-031',
 name: 'Cecep Supriatna',
 branch: 'BAF Bandung Soekarno-Hatta',
 phone: '0821-3344-5511',
 activeStatus: 'active',
 todayCompleted: 7,
 todayPending: 0,
 slaComplianceRate: 99.1,
 mockGpsFlagsCount: 0,
 avgDistanceDeviationMeters: 42,
 rating: 4.95,
 assignedCases: [
 {
 caseId: 'CASE-0945',
 applicantName: 'Ahmad Fauzi Pratama',
 vehicleModel: 'Yamaha XSR 155 Heritage',
 targetAddress: 'Jl. Raya Baleendah No. 42 RT 003 RW 006, Baleendah, Bandung',
 status: 'completed',
 scheduledTime: '08:50 WIB',
 distanceMeters: 52,
 hasMockLocation: false,
 },
 {
 caseId: 'CASE-0951',
 applicantName: 'Rizky Kurniawan',
 vehicleModel: 'Yamaha All New R15 Connected',
 targetAddress: 'Jl. Ir. H. Juanda No. 120, Dago, Bandung',
 status: 'completed',
 scheduledTime: '14:50 WIB',
 distanceMeters: 480,
 hasMockLocation: false,
 }
 ],
 },
 {
 id: 'SRV-SBY-042',
 name: 'Dimas Wicaksono',
 branch: 'BAF Surabaya Timur',
 phone: '0857-1122-3344',
 activeStatus: 'on_duty',
 todayCompleted: 5,
 todayPending: 3,
 slaComplianceRate: 91.0,
 mockGpsFlagsCount: 0,
 avgDistanceDeviationMeters: 65,
 rating: 4.6,
 assignedCases: [
 {
 caseId: 'CASE-0944',
 applicantName: 'Dewi Anggraini',
 vehicleModel: 'Yamaha Grand Filano Neo',
 targetAddress: 'Jl. Kertajaya No. 88 RT 001 RW 003, Gubeng, Surabaya',
 status: 'flagged',
 scheduledTime: '09:30 WIB',
 distanceMeters: 48,
 hasMockLocation: false,
 },
 {
 caseId: 'CASE-0950',
 applicantName: 'Nurul Hidayati',
 vehicleModel: 'Yamaha Mio M3 125',
 targetAddress: 'Jl. Mayjen Sungkono No. 72, Sawahan, Surabaya',
 status: 'completed',
 scheduledTime: '11:00 WIB',
 distanceMeters: 25,
 hasMockLocation: false,
 }
 ],
 }
];
