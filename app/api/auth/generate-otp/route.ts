import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { sendSMS } from "@/lib/twilio";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Types

/**
 * Custom User type to include OTP-specific fields
 */
type UserWithOTP = {
  id: string;
  email: string;
  phoneNumber: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  otp: string | null;
  otpExpires: Date | null;
  otpTries: number;
  firstName: string;
  role: {
    displayName: string;
  };
};

// Extend Prisma for typed access
const customPrisma = prisma as unknown as {
  user: {
    findUnique: (args: any) => Promise<UserWithOTP | null>;
    update: (args: any) => Promise<UserWithOTP>;
  };
  setting: {
    findUnique: (args: any) => Promise<{ value: string } | null>;
    findFirst: (args: any) => Promise<{ value: string } | null>;
  };
};

// Validation Schemas
const requestOTPSchema = z.object({
  email: z.string().email(),
  ip: z.string().optional(),
});

const verifyOTPSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

// Helpers
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function getEmailAndSmsSettings(key: string): Promise<string | undefined> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value;
}

// POST handler: Request OTP
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = requestOTPSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request format", details: result.error.errors },
        { status: 400 }
      );
    }

    const { email, ip } = result.data;

    const [emailEnabledSetting, phoneEnabledSetting] = await Promise.all([
      customPrisma.setting.findUnique({ where: { key: "OTP_EMAIL_ENABLED" } }),
      customPrisma.setting.findUnique({ where: { key: "OTP_PHONE_ENABLED" } }),
    ]);

    const isEmailEnabled = emailEnabledSetting?.value === "true";
    const isPhoneEnabled = phoneEnabledSetting?.value === "true";

    if (!isEmailEnabled && !isPhoneEnabled) {
      return NextResponse.json(
        { error: "OTP is disabled for both email and phone" },
        { status: 400 }
      );
    }

    const user = await customPrisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        emailVerified: true,
        phoneVerified: true,
        otp: true,
        otpExpires: true,
        otpTries: true,
        role: true,
        firstName: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const otp = generateOTP();
    const [expirySetting, lengthSetting] = await Promise.all([
      customPrisma.setting.findUnique({ where: { key: "OTP_EXPIRY_MINUTES" } }),
      customPrisma.setting.findUnique({ where: { key: "OTP_LENGTH" } }),
    ]);

    const expiryMinutes = parseInt(expirySetting?.value ?? "5");
    const otpLength = parseInt(lengthSetting?.value ?? "6");
    const otpExpires = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await customPrisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otpExpires,
        otpTries: 0,
      },
      include: { role: true },
    });

    let emailSent = false;
    let smsSent = false;

    if (isEmailEnabled) {
      try {
        const emailTemplate = await prisma.emailTemplate.findUnique({
          where: { name: "otp_verification" },
        });
        
        const templateData = (emailTemplate?.body || '{}');
        const html = templateData
          .replace("{{otp}}", otp)
          .replace("{{userName}}", user.firstName)
          .replace("{{expiryTime}}", expiryMinutes.toString())
          .replace("{{role}}", user.role.displayName);
          console.log(html, 'html')

        emailSent = await sendEmail({
          to: user.email,
          subject: emailTemplate?.subject,
          html,
        });
      } catch (err) {
        console.error("Email send failed:", err);
      }
    }

    const smsTemplate = await getEmailAndSmsSettings("smsTemplate");
    const smsTemplateData = JSON.parse(smsTemplate || '{}');

    if (isPhoneEnabled && user.phoneNumber) {
      try {
        smsSent = await sendSMS({
          to: user.phoneNumber,
          body: smsTemplateData.verification.body.replace("{{otp}}", otp),
          ip,
        });
      } catch (err) {
        console.error("SMS send failed:", err);
      }
    }

    if (!emailSent && !smsSent) {
      return NextResponse.json(
        { error: "Failed to send OTP via any channel" },
        { status: 500 }
      );
    }

    const responseData: Record<string, any> = {
      message: "OTP sent successfully",
      otpExpires,
      otpLength,
      sentVia: { email: emailSent, sms: smsSent },
    };

    if (process.env.NODE_ENV === "development") {
      responseData.otp = otp;
      responseData.contact = {
        email: user.email,
        phone: user.phoneNumber,
      };
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("OTP Request Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT handler: Verify OTP
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { email, code } = verifyOTPSchema.parse(body);

    const [emailEnabledSetting, phoneEnabledSetting] = await Promise.all([
      customPrisma.setting.findUnique({ where: { key: "OTP_EMAIL_ENABLED" } }),
      customPrisma.setting.findUnique({ where: { key: "OTP_PHONE_ENABLED" } }),
    ]);

    const isEmailEnabled = emailEnabledSetting?.value === "true";
    const isPhoneEnabled = phoneEnabledSetting?.value === "true";

    if (!isEmailEnabled && !isPhoneEnabled) {
      return NextResponse.json(
        { error: "OTP verification is disabled" },
        { status: 400 }
      );
    }

    const user = await customPrisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        otp: true,
        otpExpires: true,
        otpTries: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.otp || !user.otpExpires || user.otp !== code || new Date() > user.otpExpires) {
      const maxAttemptsSetting = await customPrisma.setting.findUnique({ where: { key: "OTP_MAX_ATTEMPTS" } });
      const maxAttempts = parseInt(maxAttemptsSetting?.value ?? "3");

      await customPrisma.user.update({
        where: { id: user.id },
        data: { otpTries: { increment: 1 } },
      });

      if ((user.otpTries ?? 0) + 1 >= maxAttempts) {
        return NextResponse.json(
          { error: "Maximum OTP attempts exceeded" },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    await customPrisma.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otpExpires: null,
        otpTries: 0,
      },
    });

    return NextResponse.json({ message: "OTP verified successfully" }, { status: 200 });
  } catch (error) {
    console.error("OTP Verify Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
