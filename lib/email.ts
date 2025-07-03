import { prisma } from './prisma';
import nodemailer from 'nodemailer';

interface EmailVariables {
  [key: string]: string | number | boolean;
}

async function getEmailSettings() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        category: 'email',
        key: {
          in: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM']
        }
      }
    });

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    return {
      host: settingsMap.SMTP_HOST || process.env.SMTP_HOST,
      port: Number(settingsMap.SMTP_PORT || process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: settingsMap.SMTP_USER || process.env.SMTP_USER,
        pass: settingsMap.SMTP_PASSWORD || process.env.SMTP_PASSWORD,
      },
      from: settingsMap.SMTP_FROM || process.env.SMTP_FROM,
    };
  } catch (error) {
    console.error('Error fetching email settings:', error);
    // Fallback to environment variables
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      from: process.env.SMTP_FROM,
    };
  }
}

export async function getEmailTemplate(templateName: string, variables: EmailVariables) {
  try {
    // Get template from database
    const template = await prisma.emailTemplate.findUnique({
      where: { name: templateName },
    });

    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    if (!template.isActive) {
      throw new Error(`Email template '${templateName}' is not active`);
    }

    // Parse required variables
    const requiredVariables = JSON.parse(template.variables);
    
    // Check if all required variables are provided
    for (const variable of requiredVariables) {
      if (!(variable in variables)) {
        throw new Error(`Missing required variable: ${variable}`);
      }
    }

    // Replace variables in subject and body
    let subject = template.subject;
    let body = template.body;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, String(value));
      body = body.replace(regex, String(value));
    }

    return {
      subject,
      body,
    };
  } catch (error) {
    console.error('Error getting email template:', error);
    throw error;
  }
}

export async function sendOTPEmail(email: string, otp: string) {
  try {
    const settings = await getEmailSettings();
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: settings.auth,
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    });

  

    // Get email template
    const { subject, body } = await getEmailTemplate('otp_verification', { otp });

    await transporter.sendMail({
      from: settings.from,
      to: email,
      subject,
      html: body
    });
    return true;
  } catch (error) {

    console.error('Error sending email:', error);
    const settings = await getEmailSettings();
    return false;
  }
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getEmailSettings();
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: settings.auth,
      tls: {
        rejectUnauthorized: false // Don't fail on self-signed certs
      }
    });

    await transporter.sendMail({
      from: settings.from,
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: String(error) };
  }
}


// Example usage:
// const emailContent = await getEmailTemplate('welcome_email', {
//   userName: 'John Doe',
//   verificationLink: 'https://example.com/verify',
// }); 