export function getNigerianPublicHolidays2026(): Date[] {
  // Approximate list of public holidays in Nigeria for 2026
  return [
    new Date('2026-01-01'), // New Year's Day
    new Date('2026-03-20'), // Eid el-Fitr (approximate)
    new Date('2026-03-23'), // Eid el-Fitr (approximate, if it falls on weekend)
    new Date('2026-04-03'), // Good Friday
    new Date('2026-04-06'), // Easter Monday
    new Date('2026-05-01'), // Workers' Day
    new Date('2026-05-27'), // Eid el-Kabir (approximate)
    new Date('2026-05-28'), // Eid el-Kabir (approximate)
    new Date('2026-06-12'), // Democracy Day
    new Date('2026-10-01'), // Independence Day
    new Date('2026-12-25'), // Christmas Day
    new Date('2026-12-26'), // Boxing Day
    new Date('2026-12-28')  // Boxing Day observed
  ];
}

export function isWorkingDay(date: Date): boolean {
  // Use UTC to avoid timezone issues, but conceptually Africa/Lagos
  const dayOfWeek = date.getUTCDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false; // Weekend
  }
  
  const dateString = date.toISOString().split('T')[0];
  const holidays = getNigerianPublicHolidays2026().map(d => d.toISOString().split('T')[0]);
  
  if (holidays.includes(dateString)) {
    return false; // Public holiday
  }
  
  return true;
}

export function addWorkingDays(date: Date, days: number): Date {
  const result = new Date(date);
  let daysAdded = 0;
  
  while (daysAdded < days) {
    result.setUTCDate(result.getUTCDate() + 1);
    if (isWorkingDay(result)) {
      daysAdded++;
    }
  }
  
  return result;
}

export function workingDaysBetween(start: Date, end: Date): number {
  if (start > end) {
    return -workingDaysBetween(end, start);
  }
  
  let current = new Date(start);
  let workingDays = 0;
  
  // Don't count start date, start from next day
  current.setUTCDate(current.getUTCDate() + 1);
  
  while (current <= end) {
    if (isWorkingDay(current)) {
      workingDays++;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }
  
  return workingDays;
}
