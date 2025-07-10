import { DiscountCode } from '../types';

export const PRODUCTION_DISCOUNT_CODES: DiscountCode[] = [
  {
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    description: '10% off for new customers'
  },
  {
    code: 'SAVE50',
    type: 'fixed',
    value: 50,
    description: '₹50 flat discount'
  },
  {
    code: 'STUDENT15',
    type: 'percentage',
    value: 15,
    description: '15% student discount'
  }
]; 