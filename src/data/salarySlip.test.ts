import { describe, it, expect } from 'bun:test';
import { calculateDsr, defaultSalarySlip } from './salarySlipHelper';

describe('Salary Slip Calculations & DSR', () => {
  it('calculates DSR correctly against OJK 35% threshold', () => {
    // Installment: 1,850,000, THP: 6,850,000 -> 27.01% (Healthy <= 35%)
    const result = calculateDsr(1850000, 6850000);
    expect(result.dsrPercentage).toBeCloseTo(27.01, 1);
    expect(result.isDsrHealthy).toBe(true);

    // Installment: 3,000,000, THP: 6,000,000 -> 50% (Exceeds threshold)
    const resultHigh = calculateDsr(3000000, 6000000);
    expect(resultHigh.dsrPercentage).toBe(50);
    expect(resultHigh.isDsrHealthy).toBe(false);

    // Zero or negative THP edge case
    const resultZero = calculateDsr(1000000, 0);
    expect(resultZero.dsrPercentage).toBe(100);
    expect(resultZero.isDsrHealthy).toBe(false);
  });

  it('provides default salary slip breakdown with verified stamp', () => {
    expect(defaultSalarySlip.companyName).toBe('PT Citra Nusantara Mandiri');
    expect(defaultSalarySlip.takeHomePay).toBe(6850000);
    expect(defaultSalarySlip.earnings.gajiPokok).toBe(5500000);
    expect(defaultSalarySlip.earnings.totalTunjangan).toBe(1800000);
    expect(defaultSalarySlip.deductions.totalPotongan).toBe(450000);
    expect(defaultSalarySlip.stampStatus).toBe('verified');
  });
});
