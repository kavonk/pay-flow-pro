// Types for the payout account wizard
export interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: (value: any) => ValidationResult;
}

export const VALIDATION_RULES = {
  email: (value: string): ValidationResult => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(value),
      errors: emailRegex.test(value) ? [] : ['Please enter a valid email address']
    };
  },
  
  phone: (value: string): ValidationResult => {
    const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
    return {
      isValid: phoneRegex.test(value.replace(/\s/g, '')),
      errors: phoneRegex.test(value.replace(/\s/g, '')) ? [] : ['Please enter a valid phone number']
    };
  },
  
  required: (value: any): ValidationResult => {
    const isValid = value !== null && value !== undefined && value !== '';
    return {
      isValid,
      errors: isValid ? [] : ['This field is required']
    };
  },
  
  url: (value: string): ValidationResult => {
    if (!value) return { isValid: true, errors: [] }; // Optional field
    try {
      new URL(value);
      return { isValid: true, errors: [] };
    } catch {
      return { isValid: false, errors: ['Please enter a valid URL'] };
    }
  },
  
  dateOfBirth: (day: number, month: number, year: number): ValidationResult => {
    const currentYear = new Date().getFullYear();
    const isValidDay = day >= 1 && day <= 31;
    const isValidMonth = month >= 1 && month <= 12;
    const isValidYear = year >= 1900 && year <= currentYear - 18; // Must be 18+
    
    const errors: string[] = [];
    if (!isValidDay) errors.push('Invalid day');
    if (!isValidMonth) errors.push('Invalid month');
    if (!isValidYear) errors.push('You must be at least 18 years old');
    
    return {
      isValid: isValidDay && isValidMonth && isValidYear,
      errors
    };
  }
};

export const STEP_CONFIGS: WizardStep[] = [
  {
    id: 1,
    title: 'Business Information',
    description: 'Basic information about your business',
    icon: () => null // Will be imported in component
  },
  {
    id: 2,
    title: 'Representative Details',
    description: 'Information about the business representative',
    icon: () => null
  },
  {
    id: 3,
    title: 'Business Profile',
    description: 'Details about your business operations',
    icon: () => null
  },
  {
    id: 4,
    title: 'Bank Account',
    description: 'Where you\'ll receive your payouts',
    icon: () => null
  }
];
