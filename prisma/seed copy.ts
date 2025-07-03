import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create roles
  const roles = [
    {
      name: "customer",
      description: "Regular customer who can place orders",
    },
    {
      name: "admin",
      description: "System administrator with full access",
    },
    {
      name: "kitchen",
      description: "Kitchen staff member",
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  // Create initial settings
  const settings = [
    // Email settings
    {
      key: "email_verification_required",
      value: "true",
      description: "Whether email verification is required for new users",
      category: "email",
      isPublic: true,
    },
    {
      key: "otp_login_enabled",
      value: "true",
      description: "Whether OTP-based login is enabled",
      category: "system",
      isPublic: true,
    },
    // Social login settings
    {
      key: "google_login_enabled",
      value: "true",
      description: "Whether Google login is enabled",
      category: "social",
      isPublic: true,
    },
    {
      key: "facebook_login_enabled",
      value: "true",
      description: "Whether Facebook login is enabled",
      category: "social",
      isPublic: true,
    },
    {
      key: "google_client_id",
      value: process.env.GOOGLE_CLIENT_ID || "",
      description: "Google OAuth client ID",
      category: "social",
      isPublic: false,
    },
    {
      key: "google_client_secret",
      value: process.env.GOOGLE_CLIENT_SECRET || "",
      description: "Google OAuth client secret",
      category: "social",
      isPublic: false,
    },
    {
      key: "facebook_client_id",
      value: process.env.FACEBOOK_CLIENT_ID || "",
      description: "Facebook OAuth client ID",
      category: "social",
      isPublic: false,
    },
    {
      key: "facebook_client_secret",
      value: process.env.FACEBOOK_CLIENT_SECRET || "",
      description: "Facebook OAuth client secret",
      category: "social",
      isPublic: false,
    }
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // Create a default admin user
  const adminRole = await prisma.role.findUnique({
    where: { name: "admin" },
  });

  if (adminRole) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        roleId: adminRole.id,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 