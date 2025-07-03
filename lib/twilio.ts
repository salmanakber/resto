import twilio from 'twilio';
import { prisma } from './prisma';
import { isValidPhoneNumber, formatPhoneNumber } from './utils/phone';
import ipapi from 'ipapi.co';

// utils/ip.ts (server-side only

async function getCountryFromIP(ip: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      ipapi.location((result: any) => {
        if (result && result.country) {
          resolve(result.country);
        } else {
          console.warn("Invalid IPAPI result, falling back:", result);
          resolve(result); // ✅ Always resolve something
        }
      }, ip, "", "country");
    } catch (error) {
      console.error("ipapi failed:", error);
      resolve("US"); // ✅ Ensure resolution even on error
    }
  });
}


async function getTwilioSettings() {
  try {
    const setting = await prisma.setting.findFirst({
      where: {
        key: 'twilio',
        category: 'general',
        isPublic: true,
      },
      select: { value: true },
    });

    if (!setting?.value) throw new Error('Twilio setting not found');

    const config = JSON.parse(setting.value);
    return {
      accountSid: config.accountSid,
      authToken: config.authToken,
      phoneNumber: config.phoneNumber,
    };
  } catch (err) {
    console.error('Error fetching Twilio settings:', err.message);
    return {
      accountSid: process.env.TWILIO_ACCOUNT_SID!,
      authToken: process.env.TWILIO_AUTH_TOKEN!,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
    };
  }
}

interface SMSOptions {
  to: string;
  body: string;
  ip?: string; // Optional if you call from server API
}

export async function sendSMS({ to, body , ip}: SMSOptions) {
  const settings = await getTwilioSettings();
  let ipAddress: string;
  if(ip === '::1') {
      ipAddress = "182.190.200.70"
  } else {
    ipAddress = ip || "182.190.200.70"
  }
  console.log(ipAddress, 'ipAddress')
  // Step 1: Get country from IP (if IP is provided)
  const countryCode =  await getCountryFromIP(ipAddress);

  // Step 2: Validate and format number
  const isValid = isValidPhoneNumber(to, countryCode);
  const formatted = formatPhoneNumber(to, countryCode);

  if (!isValid || !formatted) {
    throw new Error(`Invalid phone number: ${to}`);
  }

  // Step 3: Send SMS
  const client = twilio(settings.accountSid, settings.authToken);
  try {
    await client.messages.create({
      body,
      to: formatted,
      from: settings.phoneNumber,
    });
  } catch (error) {
    if(process.env.NODE_ENV === "development") {
      console.error('Error sending SMS:', error);
    }
  }
}
