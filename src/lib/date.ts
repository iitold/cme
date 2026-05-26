export function parseLocalDate(dateInput: string | Date | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  
  // If it's a string like YYYY-MM-DD
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split('-').map(Number);
    // month is 0-indexed in Date constructor
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
  }

  // Fallback for other formats
  const date = new Date(dateInput);
  return isNaN(date.getTime()) ? null : date;
}

export function formatVietnamDate(dateInput: string | Date | undefined): string {
  const d = parseLocalDate(dateInput);
  if (!d) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function toInputDateFormat(dateInput: string | Date | undefined): string {
  const d = parseLocalDate(dateInput);
  if (!d) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`; // yyyy-MM-dd for standard input type="date"
}

export function addYears(dateInput: string | Date | undefined, years: number): Date | null {
  const d = parseLocalDate(dateInput);
  if (!d) return null;
  const originalYear = d.getFullYear();
  const originalMonth = d.getMonth();
  const originalDay = d.getDate();
  
  const targetYear = originalYear + years;
  const targetDate = new Date(targetYear, originalMonth, originalDay);
  
  // Leap Year check: if month shifts (e.g. Feb 29 in non-leap year becomes March 1)
  if (targetDate.getMonth() !== originalMonth) {
    return new Date(targetYear, 1, 28); // Force to Feb 28
  }
  return targetDate;
}

export function daysBetween(date1: string | Date | undefined, date2: string | Date | undefined): number | null {
  const d1 = parseLocalDate(date1);
  const d2 = parseLocalDate(date2);
  if (!d1 || !d2) return null;
  
  // Set times to midnight to calculate pure days difference
  const t1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
  const t2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
  
  const diffTime = t2 - t1;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

