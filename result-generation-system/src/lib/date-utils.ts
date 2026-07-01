import { format, parseISO, isValid, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export const dateUtils = {
  // Format date string
  formatDate: (dateString: string, formatStr: string = 'PPP'): string => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return dateString;
      return format(date, formatStr);
    } catch {
      return dateString;
    }
  },

  // Format datetime
  formatDateTime: (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return dateString;
      return format(date, 'PPP p');
    } catch {
      return dateString;
    }
  },

  // Get relative time
  getRelativeTime: (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / 60000);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInMinutes < 1) return 'just now';
      if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      
      return format(date, 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  },

  // Check if date is in range
  isInRange: (dateString: string, startDate: string, endDate: string): boolean => {
    try {
      const date = parseISO(dateString);
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      return date >= start && date <= end;
    } catch {
      return false;
    }
  },

  // Get current academic session
  getCurrentSession: (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // If before September, use previous year
    if (month < 8) {
      return `${year - 1}/${year}`;
    }
    return `${year}/${year + 1}`;
  },

  // Get current term based on date
  getCurrentTerm: (): 'First' | 'Second' | 'Third' => {
    const month = new Date().getMonth();
    
    if (month >= 8 && month <= 11) return 'First'; // Sept - Dec
    if (month >= 0 && month <= 3) return 'Second'; // Jan - Apr
    return 'Third'; // May - Aug
  },
};