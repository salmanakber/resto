import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedOTPSettings() {
  const otpSettings = [
//     {
//       key: 'OTP_EMAIL_ENABLED',
//       value: 'true',
//       description: 'Enable or disable email OTP verification',
//       category: 'security',
//       isPublic: true,
//     },
//     {
//       key: 'OTP_PHONE_ENABLED',
//       value: 'true',
//       description: 'Enable or disable phone OTP verification',
//       category: 'security',
//       isPublic: true,
//     },
//     {
//       key: 'OTP_EXPIRY_MINUTES',
//       value: '5',
//       description: 'OTP expiry time in minutes',
//       category: 'security',
//       isPublic: true,
//     },
//     {
//       key: 'OTP_LENGTH',
//       value: '6',
//       description: 'Length of the OTP code',
//       category: 'security',
//       isPublic: true,
//     },
//     {
//       key: 'OTP_MAX_ATTEMPTS',
//       value: '3',
//       description: 'Maximum number of OTP verification attempts before lockout',
//       category: 'security',
//       isPublic: true,
//     },
//     {
//       key: 'OTP_COOLDOWN_MINUTES',
//       value: '15',
//       description: 'Cooldown period in minutes after maximum attempts are reached',
//       category: 'security',
//       isPublic: true,
//     },
//     {
//       key: 'currency',
//       value: JSON.stringify(
//         {
//           USD: { symbol: '$', name: 'United States Dollar' },
//           EUR: { symbol: '€', name: 'Euro' , default: true  },
//           GBP: { symbol: '£', name: 'British Pound' },
//           CAD: { symbol: '$', name: 'Canadian Dollar' },
//           AUD: { symbol: '$', name: 'Australian Dollar' },
//           NZD: { symbol: '$', name: 'New Zealand Dollar' },
//           CHF: { symbol: 'CHF', name: 'Swiss Franc' },
//           JPY: { symbol: '¥', name: 'Japanese Yen' },
//           CNY: { symbol: '¥', name: 'Chinese Yuan' },
//           INR: { symbol: '₹', name: 'Indian Rupee' },
//           BRL: { symbol: 'R$', name: 'Brazilian Real' },
//           ARS: { symbol: '$', name: 'Argentine Peso' },
//           CLP: { symbol: '$', name: 'Chilean Peso' },
//           COP: { symbol: '$', name: 'Colombian Peso' },
//           MXN: { symbol: '$', name: 'Mexican Peso' },
//           PEN: { symbol: 'S/', name: 'Peruvian Sol' },
//           PYG: { symbol: '₲', name: 'Paraguayan Guaraní' },
//           UYU: { symbol: '$', name: 'Uruguayan Peso' },
//           VND: { symbol: '₫', name: 'Vietnamese Dong' },
//           ZAR: { symbol: 'R', name: 'South African Rand' },
//           AFG: { symbol: '؋', name: 'Afghan Afghani'},
  
//         }
//       ),
//       description: 'Currency for the application',
//       category: 'general',
//       isPublic: true,
//     },
//     {
//       key: 'taxes',
//       value: JSON.stringify({
//         gst: {
//           enabled: true,
//           taxRate: 0.1,
//           taxName: 'Sales Tax',
//         },
//         pst: {
//           enabled: true,
//           taxRate: 0.1,
//           taxName: 'Provincial Sales Tax',
//         },
//         hst: {
//           enabled: true,
//           taxRate: 0.1,
//           taxName: 'Harmonized Sales Tax',
//         },
//       }),
//       description: 'Taxes for the application',
//       category: 'general',
//       isPublic: true,
//     },
//     {
//       key: 'loyalty',
//       value: JSON.stringify({
//         enabled: true,
//         earnRate: 1, // 1 point per $1 spent
//         redeemRate: 100, // 100 points = $5 discount
//         redeemValue: 5,
//         minRedeemPoints: 100, // Minimum points required to redeem
//         pointExpiryDays: 365, // Points expire after 1 year
//       }),
//       description: 'Loyalty program settings (earn/redeem rates, expiry, etc.)',
//       category: 'general',
//       isPublic: true,
//     },
//    
//     {
//       key: 'company',
//       value: JSON.stringify({
//         name: 'OpenPho',
//         address: '123 Main St, Anytown, USA',
//         phone: '+19803605927',
//         email: 'info@openpho.com',
//         logo: 'https://openpho.com/logo.png',
//         timezone: 'America/New_York',
//         language: 'en',
//         dateFormat: 'MM/DD/YYYY',
//         timeFormat: 'HH:mm',
//         decimalSeparator: '.',
//         registrationNumber: '1234567890',
//         taxNumber: '1234567890',
//       }),
//       description: 'Company information',
//       category: 'general',
//       isPublic: true,
//     },

    {
      key: 'smsTemplate',
      value: JSON.stringify({
        order: {
          body: 'Your order #{{orderId}} has been confirmed. Your OTP for pickup is: {{otp}}',
        },
        login: {
          body: 'Your login OTP is: {{otp}}',
        },
        verification: {
          body: 'Your account verification OTP is: {{otp}}',
        }
      }),
      description: 'SMS template',
      category: 'general',
      isPublic: true,
    },
//     {
//       key: 'map',
//       value: JSON.stringify({
//         map: {
//           apiKey: 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg',
//           autolocation: true
//         }
//       }),
//       description: 'Map settings',
//       category: 'general',
//       isPublic: true,
//     },
//     {
//       key: 'timeZone',
//       value: JSON.stringify({
//         america: {
//           timeZone: 'America/New_York',
//           timeZoneList: ['America/New_York', 'America/Los_Angeles', 'America/Chicago', 'America/Denver', 'America/Phoenix'],
//           default: 'America/Los_Angeles',
//         },
//         europe: {
//           timeZone: 'Europe/London',
//           timeZoneList: ['Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome'],
//           default: 'Europe/London',
//         },
//         asia: {
//           timeZone: 'Asia/Tokyo',
//           timeZoneList: ['Asia/Tokyo', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Seoul', 'Asia/Tokyo'],
//           default: 'Asia/Tokyo',
//         },
//         africa: {
//           timeZone: 'Africa/Cairo',
//           timeZoneList: ['Africa/Cairo', 'Africa/Johannesburg', 'Africa/Nairobi', 'Africa/Lagos', 'Africa/Cairo'],
//           default: 'Africa/Cairo',
//         },
//         oceania: {
//           timeZone: 'Pacific/Auckland',
//           timeZoneList: ['Pacific/Auckland', 'Pacific/Sydney', 'Pacific/Melbourne', 'Pacific/Auckland'],
//           default: 'Pacific/Auckland',
//         },
//         antarctica: {
//           timeZone: 'Antarctica/South_Pole',
//           timeZoneList: ['Antarctica/South_Pole', 'Antarctica/Vostok', 'Antarctica/Casey', 'Antarctica/Davis', 'Antarctica/South_Pole'],
//           default: 'Antarctica/South_Pole',
//         },
//         canada: {
//           timeZone: 'America/Toronto',
//           timeZoneList: ['America/Toronto', 'America/Vancouver', 'America/Montreal', 'America/Toronto'],
//           default: 'America/Toronto',
//         },
//         india: {
//           timeZone: 'Asia/Kolkata',
//           timeZoneList: ['Asia/Kolkata', 'Asia/Calcutta', 'Asia/Kolkata', 'Asia/Kolkata'],
//           default: 'Asia/Kolkata',
//         },
//         brazil: {
//           timeZone: 'America/Sao_Paulo',
//           timeZoneList: ['America/Sao_Paulo', 'America/Sao_Paulo', 'America/Sao_Paulo', 'America/Sao_Paulo'],
//           default: 'America/Sao_Paulo',
//         },
//         australia: {
//           timeZone: 'Australia/Sydney',
//           timeZoneList: ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Sydney'],
//           default: 'Australia/Sydney',
//         },
//         china: {
//           timeZone: 'Asia/Shanghai',
//           timeZoneList: ['Asia/Shanghai', 'Asia/Shanghai', 'Asia/Shanghai', 'Asia/Shanghai'],
//           default: 'Asia/Shanghai',
//         },  
//       }),
//       description: 'Time zone',
//       category: 'general',
//       isPublic: true,
//     }
  ];

  for (const setting of otpSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting,
    });
  }
} 