import { format, parseISO, isValid, differenceInYears, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

// ========================================
// HealthFlow - Utility Functions
// ========================================

// Date utilities
export const formatDate = (date: Date | string, pattern = 'dd/MM/yyyy'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern, { locale: ptBR });
};

export const formatDateTime = (date: Date | string, pattern = 'dd/MM/yyyy HH:mm'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern, { locale: ptBR });
};

export const formatDateTimezone = (
  date: Date | string,
  timezone: string,
  pattern = 'dd/MM/yyyy HH:mm'
): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(d, timezone, pattern, { locale: ptBR });
};

export const toTimezone = (date: Date | string, timezone: string): Date => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(d, timezone);
};

export const calculateAge = (birthDate: Date | string): number => {
  const d = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate;
  return differenceInYears(new Date(), d);
};

export const getAppointmentEndTime = (startTime: Date, durationMinutes: number): Date => {
  return addMinutes(startTime, durationMinutes);
};

export const isValidDate = (date: unknown): boolean => {
  if (date instanceof Date) return isValid(date);
  if (typeof date === 'string') return isValid(parseISO(date));
  return false;
};

// Document formatting utilities
export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
};

export const formatZipCode = (zipCode: string): string => {
  const cleaned = zipCode.replace(/\D/g, '');
  if (cleaned.length !== 8) return zipCode;
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
};

// Clean document utilities (remove formatting)
export const cleanCPF = (cpf: string): string => cpf.replace(/\D/g, '');
export const cleanCNPJ = (cnpj: string): string => cnpj.replace(/\D/g, '');
export const cleanPhone = (phone: string): string => phone.replace(/\D/g, '');

// Validation utilities
export const isValidCPF = (cpf: string): boolean => {
  const cleaned = cleanCPF(cpf);
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cleaned[10]);
};

export const isValidCNPJ = (cnpj: string): boolean => {
  const cleaned = cleanCNPJ(cnpj);
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleaned[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  return digit2 === parseInt(cleaned[13]);
};

// Currency formatting
export const formatCurrency = (value: number, currency = 'BRL'): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value);
};

export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^\d,-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

// String utilities
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const capitalizeWords = (text: string): string => {
  const lowerCaseWords = ['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'por'];
  return text
    .split(' ')
    .map((word, index) => {
      if (index > 0 && lowerCaseWords.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return capitalize(word);
    })
    .join(' ');
};

export const maskEmail = (email: string): string => {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const maskedUser = user.length <= 2 ? user : user[0] + '*'.repeat(user.length - 2) + user.slice(-1);
  return `${maskedUser}@${domain}`;
};

export const maskCPF = (cpf: string): string => {
  const formatted = formatCPF(cpf);
  return formatted.replace(/(\d{3})\.\d{3}\.\d{3}(-\d{2})/, '$1.***.***$2');
};

// Object utilities
export const removeUndefined = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  ) as Partial<T>;
};

export const pick = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  return keys.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {} as Pick<T, K>);
};

export const omit = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key as K))
  ) as Omit<T, K>;
};

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

export const unique = <T>(array: T[]): T[] => [...new Set(array)];

export const sortByDate = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[key] as string | Date).getTime();
    const dateB = new Date(b[key] as string | Date).getTime();
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
};

// ID generation
export const generateId = (): string => {
  return crypto.randomUUID();
};

export const generateShortId = (length = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Error handling
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

// Async utilities
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> => {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await sleep(delayMs * attempt);
      }
    }
  }
  throw lastError;
};
