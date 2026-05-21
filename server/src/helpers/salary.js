/**
 * Auto salary calculation helper
 * Calculate net salary based on attendance
 */

function calculateSalary(baseSalary, totalWorkingDays, presentDays, halfDays = 0) {
  const effectiveDays = presentDays + (halfDays * 0.5);
  const perDaySalary = baseSalary / totalWorkingDays;
  const absentDays = totalWorkingDays - effectiveDays;
  const deductions = absentDays * perDaySalary;
  const netSalary = baseSalary - deductions;

  return {
    baseSalary,
    attendanceDays: effectiveDays,
    deductions: Math.round(deductions * 100) / 100,
    netSalary: Math.round(netSalary * 100) / 100
  };
}

module.exports = { calculateSalary };
