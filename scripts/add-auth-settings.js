import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addOrUpdateSetting(key, value, category) {
  try {
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value, category },
      create: { key, value, category },
    });
    
    return setting;
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Adding authentication settings to the database...');
    
    // Add social auth settings
    await addOrUpdateSetting("google_client_id", process.env.GOOGLE_CLIENT_ID || "", "social");
    await addOrUpdateSetting("google_client_secret", process.env.GOOGLE_CLIENT_SECRET || "", "social");
    await addOrUpdateSetting("facebook_client_id", process.env.FACEBOOK_CLIENT_ID || "", "social");
    await addOrUpdateSetting("facebook_client_secret", process.env.FACEBOOK_CLIENT_SECRET || "", "social");
    
    // Add OTP settings
    await addOrUpdateSetting("OTP_EMAIL_ENABLED", "true", "system");
    await addOrUpdateSetting("OTP_PHONE_ENABLED", "false", "system");
    await addOrUpdateSetting("OTP_LENGTH", "6", "system");
    await addOrUpdateSetting("OTP_EXPIRY_MINUTES", "5", "system");
    await addOrUpdateSetting("OTP_MAX_ATTEMPTS", "3", "system");
    await addOrUpdateSetting("otp_login_enabled", "true", "system");
    
    console.log('Finished adding authentication settings');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 