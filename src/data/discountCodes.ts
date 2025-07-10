import { DiscountCode } from '../types';

export const discountCodes: DiscountCode[] = [
  {
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    description: '10% off for new customers'
  },
  {
    code: 'SAVE5',
    type: 'fixed',
    value: 5,
    description: '$5 flat discount'
  },
  {
    code: 'STUDENT15',
    type: 'percentage',
    value: 15,
    description: '15% student discount'
  },
  {
    code: 'SENIOR20',
    type: 'percentage',
    value: 20,
    description: '20% senior citizen discount'
  }
];