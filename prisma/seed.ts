import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedOTPSettings } from './seed/otp-settings';

const prisma = new PrismaClient();

async function main() {
  // Create roles


  const roles = [
    {
      name: "Customer",
      displayName: "Customer",
      description: "Regular customer who can place orders",
    },
    {
      name: "Admin",
      displayName: "Administrator",
      description: "Regular customer who can place orders",
    },
    {
      name: "Restaurant",
      displayName: "Owner/Head",
      description: "Head/Owner with full restaurant access",
      access_area: JSON.stringify([
        'MANAGE_POS',
        'MODIFY_ORDER',
        'KITCHEN_DISPLAY_SCREEN',
        'KITCHEN_DASHBOARD',
        'RESTAURANT_DASHBOARD',
        'EMPLOYEE_MODULE_ACCESS',
        'DELETE_ORDER',
        'SETUP_IT_DEPARTMENT'
      ])
    },
    {
      name: "Restaurant_manager",
      displayName: "Manager/Senior",
      description: "Manager/Senior with management access",
      access_area: JSON.stringify([
        'MANAGE_POS',
        'MODIFY_ORDER',
        'KITCHEN_DISPLAY_SCREEN',
        'KITCHEN_DASHBOARD',
        'EMPLOYEE_MODULE_ACCESS',
        'DELETE_ORDER'
      ])
    },
    {
      name: "Restaurant_supervisor",
      displayName: "Assist/Supervisor",
      description: "Assist/Supervisor with supervisory access",
      access_area: JSON.stringify([
        'MANAGE_POS',
        'MODIFY_ORDER',
        'KITCHEN_DISPLAY_SCREEN',
        'KITCHEN_DASHBOARD'
      ])
    },
    {
      name: "Kitchen_boy",
      displayName: "Clerk/Waiter",
      description: "Clerk/Waiter with basic access",
      access_area: JSON.stringify([
        'MANAGE_POS',
        'MODIFY_ORDER',
        'KITCHEN_DISPLAY_SCREEN'
      ])
    },
    {
      name: "it_access",
      displayName: "IT Access",
      description: "IT Access with IT access",
      access_area: JSON.stringify([
        'MANAGE_POS',
        'MODIFY_ORDER',
        'KITCHEN_DISPLAY_SCREEN',
        'KITCHEN_DASHBOARD',
        'RESTAURANT_DASHBOARD',
        'EMPLOYEE_MODULE_ACCESS',
        'SETUP_IT_DEPARTMENT',
        'DELATION_NOT_ALLOWED',
      ])
    }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: role,
      create: role,
    });
  }

  // Create default admin user
  const adminRole = await prisma.role.findUnique({
    where: { name: "restaurant" },
  });

  // if (adminRole) {
  //   const hashedPassword = await bcrypt.hash("admin123", 10);
  //   const adminUser = await prisma.user.upsert({
  //     where: { email: "all2client@gmail.com" },
  //     update: {},
  //     create: {
  //       email: "all2client@gmail.com",
  //       password: hashedPassword,
  //       firstName: "Admin",
  //       lastName: "User",
  //       roleId: adminRole.id,
  //       emailVerified: true,
  //     },
  //   });

    // Update the user to set their own restaurantId (self-reference for restaurant owners)
  //   await prisma.user.update({
  //     where: { id: adminUser.id },
  //     data: { restaurantId: adminUser.id },
  //   });
  // }

  // Create default settings
  const settings = [
    {
      key: "EMAIL_SENDER",
      value: "noreply@restaurant.com",
      description: "Default email sender address",
      category: "email",
      isPublic: false,
    },
    {
      key: "SMS_SENDER",
      value: "RESTAURANT",
      description: "Default SMS sender name",
      category: "sms",
      isPublic: false,
    },
    {
      key: "OTP_EXPIRY_MINUTES",
      value: "5",
      description: "OTP expiration time in minutes",
      category: "system",
      isPublic: true,
    },
    {
      key: "PASSWORD_RESET_EXPIRY_HOURS",
      value: "24",
      description: "Password reset link expiration time in hours",
      category: "system",
      isPublic: true,
    },
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

  // for (const setting of settings) {
  //   await prisma.setting.upsert({
  //     where: { key: setting.key },
  //     update: {},
  //     create: setting,
  //   });
  // }

  // Create email templates
  const emailTemplates = [
    {
      name: "welcome_email",
      subject: "Welcome to {{restaurantName}}, {{userName}}!",
      body: `
        <h1>Welcome to {{restaurantName}}!</h1>
        <p>Dear {{userName}},</p>
        <p>Thank you for joining us. We're excited to have you as a customer!</p>
        <p>To get started, please verify your email by clicking the link below:</p>
        <p><a href="{{verificationLink}}">Verify Email</a></p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>Best regards,<br>The {{restaurantName}} Team</p>
      `,
      variables: JSON.stringify(["userName", "restaurantName", "verificationLink"]),
      description: "Sent when a new user signs up",
    },
    {
      name: "password_reset",
      subject: "Reset Your {{restaurantName}} Password",
      body: `
        <h1>Password Reset Request</h1>
        <p>Dear {{userName}},</p>
        <p>We received a request to reset your password for your {{restaurantName}} account.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="{{resetLink}}">Reset Password</a></p>
        <p>This link will expire in {{expiryHours}} hours.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Best regards,<br>The {{restaurantName}} Team</p>
      `,
      variables: JSON.stringify(["userName", "restaurantName", "resetLink", "expiryHours"]),
      description: "Sent when a user requests a password reset",
    },
    {
      name: "order_confirmation",
      subject: "Order Confirmation - {{orderId}}",
      body: `
        <h1>Order Confirmation</h1>
        <p>Dear {{userName}},</p>
        <p>Thank you for your order at {{restaurantName}}!</p>
        <p>Order Details:</p>
        <p>Order ID: {{orderId}}</p>
        <p>Total Amount: {{totalAmount}}</p>
        <p>Estimated Delivery Time: {{estimatedDeliveryTime}}</p>
        <p>You can track your order status here: <a href="{{orderTrackingLink}}">Track Order</a></p>
        <p>Use this QR code to pay or confirm your order at the restaurant: 
        <a href="{{qrCodeLink}}" alt="QR Code" class="qrbtn" 
        style="display: inline-block; padding: 10px 20px; background-color:rgb(255, 0, 0); color: #fff; text-decoration: none; border-radius: 5px;">
        Confirm Order <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
</svg>
        </a>
        </p>
        <p>Best regards,<br>The {{restaurantName}} Team</p>
      `,
      variables: JSON.stringify(["userName", "restaurantName", "orderId", "totalAmount", "estimatedDeliveryTime", "orderTrackingLink", "qrCodeLink"]),
      description: "Sent when an order is confirmed",
    },
    {
      name: "customer_welcome_created_by_admin",
      subject: "Welcome to {{restaurantName}}, {{userName}}!",
      body: `
       <div style="background-color: #f0f0f0; padding: 20px; border-radius: 10px; text-align: center; margin: 0 auto; max-width: 600px;">
        <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Welcome to {{restaurantName}}!</h1>
        <p style="margin-top: 20px;">Dear {{userName}},</p>
        <p style="margin-top: 20px;">Thank you for joining us. We're excited to have you as a customer!</p>
        <p style="margin-top: 20px;">Your email is: {{email}}</p>
        <p style="margin-top: 20px;">Your password is: {{password}}</p>
        <p style="margin-top: 20px;">You can login to your account here: <a href="{{loginLink}}" style="color:rgb(255, 0, 47); text-decoration: none; font-weight: bold;" >Login</a></p>
        </div>
      `,
      variables: JSON.stringify(["userName", "restaurantName", "email", "password", "loginLink"]),
      description: "Sent when a new customer is created by an admin",
    },

    {
      name: "employee_welcome_created_by_admin",
      subject: "Welcome to {{restaurantName}}, {{userName}}!",
      body: `
      <div style="background-color: #f0f0f0; padding: 20px; border-radius: 10px; text-align: center; margin: 0 auto; max-width: 600px;">
        <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Welcome to {{restaurantName}}!</h1>
        <p style="margin-top: 20px;">Dear {{userName}},</p>
        <p style="margin-top: 20px;">Thank you for joining us. We're excited to have you as a employee!</p>
        <p style="margin-top: 20px;">Your email is: {{email}}</p>
        <p style="margin-top: 20px;">Your password is: {{password}}</p>
        <p style="margin-top: 20px;">You can login to your account here: <a href="{{loginLink}}" style="color:rgb(255, 0, 47); text-decoration: none; font-weight: bold;" >Login</a></p>
        </div>
      `,
      variables: JSON.stringify(["userName", "restaurantName", "email", "password", "loginLink"]),
      description: "Sent when a new employee is created by an admin",
    },

    {
      name: "restaurant_welcome",
      subject: "Welcome to {{restaurantName}}, {{userName}}!",
      body: `
      <div style="background-color: #f0f0f0; padding: 20px; border-radius: 10px; text-align: center; margin: 0 auto; max-width: 600px;">
        <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Welcome to {{restaurantName}}!</h1>
        <p style="margin-top: 20px;">Dear {{userName}},</p>
        <p style="margin-top: 20px;">Thank you for joining us. We're excited to have you as a customer!</p>
        <p style="margin-top: 20px;">Your email is: {{email}}</p>
        <p style="margin-top: 20px;">Your password is: {{password}}</p>
        <p style="margin-top: 20px;">You can login to your account here: <a href="{{loginLink}}" style="color:rgb(255, 0, 47); text-decoration: none; font-weight: bold;" >Login</a></p>
        </div>
      `,
      variables: JSON.stringify(["userName", "restaurantName", "email", "password", "loginLink"]),
      description: "Sent when a new restaurant is created by an admin",
    },
    {
      name: "otp_verification",
      subject: "OTP Verification",
      body: `
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 10px; text-align: center; margin: 0 auto; max-width: 600px;">
            <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">OTP Verification</h1>
            <p style="margin-top: 20px;">Dear {{userName}},</p>
            <p style="margin-top: 20px;">Thank you for joining us. We're excited to have you as a {{role}}! <br>
            Your OTP is: {{otp}}</p>
            <p style="margin-top: 20px;">This OTP will expire in {{expiryTime}} minutes.</p>
          </div>
      `,
      variables: JSON.stringify(["otp", "expiryTime", "role"]),
      description: "Sent when a new user is created by an admin",
    },
    {
      name: "complaint_resolved",
      subject: "Complaint Resolved",
      body: `
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 10px; text-align: center; margin: 0 auto; max-width: 600px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Complaint Resolved</h1>
          <p style="margin-top: 20px;">Dear {{userName}},</p>
          <p style="margin-top: 20px;">Your complaint has been resolved. Thank you for your patience.</p>
          <p style="margin-top: 20px;">Best regards,<br>The {{restaurantName}} Team</p>
        </div>
      `,
      variables: JSON.stringify(["userName", "restaurantName"]),
      description: "Sent when a complaint is resolved",
    },
    {
      name: "complain_update",
      subject: "Complaint Update",
      body: `
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 10px; text-align: center; margin: 0 auto; max-width: 600px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Complaint Update</h1>
          <p style="margin-top: 20px;">Dear {{userName}},</p>
          <p style="margin-top: 20px;">Your complaint has been updated. Thank you for your patience.</p>
          <p style="margin-top: 20px;">Try to visit your account to see the update. <a href="{{supportLink}}" style="color:rgb(255, 0, 47); text-decoration: none; font-weight: bold;" >View Complaint</a> </p>
          <p style="margin-top: 20px;">Best regards,<br>The {{restaurantName}} Team</p>
        </div>
      `,
      variables: JSON.stringify(["userName", "restaurantName", "supportLink"]),
      description: "Sent when a complaint is updated",
    },
    {
      name: "item_feedback",
      subject: "Could you please give us a feedback?",
      body: `
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 10px; text-align: center; margin: 0 auto; max-width: 600px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Could you please give us a feedback?</h1>
          <p style="margin-top: 20px;">Dear {{userName}},</p>
          <p style="margin-top: 20px;">We would like to know your opinion about the item {{itemName}}.</p>
          <p style="margin-top: 20px;">Please give us a feedback by clicking the link below we will appreciate it and it will help us to improve our service.</p>
          <p style="margin-top: 20px;"><a href="{{feedbackLink}}" style="color:rgb(255, 0, 47); text-decoration: none; font-weight: bold;" >Give Feedback</a></p>
          <p style="margin-top: 20px;">Best regards,<br>The {{restaurantName}} Team</p>
        </div>
      `,  
      variables: JSON.stringify(["userName", "restaurantName", "itemName", "feedbackLink"]),
      description: "Sent when a user gives feedback about an item",
    }
    

  ];




  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template,
    });
  }

  // Create sample locations
  const locations = [
    {
      address: "123 Main Street, Downtown, New York, NY 10001",
      name: "New York",
      timeZone: "America/New_York",
      isActive: true,
      lat: "24.83363069488775", 
      lng: "67.21126761559657",
    },
    {
      address: "456 Oak Avenue, Midtown, Los Angeles, CA 90012",
      name: "Los Angeles",
      timeZone: "America/Los_Angeles",
      isActive: true,
      lat: "34.052235",
      lng: "-118.243683",
    },
    {
      address: "789 Pine Boulevard, Uptown, Chicago, IL 60601",
      name: "Chicago",
      timeZone: "America/Chicago",
      isActive: true,
      lat: "41.8781136",  
      lng: "-87.6297982",
    },
    {
      address: "321 Maple Drive, Westside, Houston, TX 77001",
      name: "Houston",
      timeZone: "America/Houston",
      isActive: true,
      lat: "29.7604267",
      lng: "-95.3698028",
    },
    {
      address: "654 Elm Street, Eastside, Miami, FL 33101",
      name: "Miami",
      timeZone: "America/Miami",
      isActive: true,
      lat: "25.761680",
      lng: "-80.191790",
    }
  ];

  // Get the admin user to associate with locations
  const adminUser = await prisma.user.findUnique({
    where: { email: "all2client@gmail.com" },
  });

  // if (adminUser) {
  //   for (const location of locations) {
  //     await prisma.location.create({
  //       data: {
  //         ...location,
  //         userId: adminUser.id,
  //       },
  //     });
  //   }
  // }

  // Seed OTP settings
  await seedOTPSettings();
  


  // Create sample menu categories
  // const categories = await Promise.all([
  //   // Main categories
  //   prisma.menuCategory.create({
  //     data: {
  //       name: 'Main Courses',
  //       description: 'Delicious main course dishes',
  //       isActive: true,
  //       order: 1,
  //       userId: '',
  //     },
  //   }),
  //   prisma.menuCategory.create({
  //     data: {
  //       name: 'Appetizers',
  //       description: 'Tasty starters and small plates',
  //       isActive: true,
  //       order: 2,
  //       userId: '',
  //     },
  //   }),
  //   prisma.menuCategory.create({
  //     data: {
  //       name: 'Desserts',
  //       description: 'Sweet treats and desserts',
  //       isActive: true,
  //       order: 3,
  //       userId: '2a80f40e-5113-46a1-ade5-20433f9d6a38',
  //     },
  //   }),
  // ])

  // // Create subcategories
  // const subcategories = await Promise.all([
  //   // Subcategories for Main Courses
  //   prisma.menuCategory.create({
  //     data: {
  //       name: 'Pasta',
  //       description: 'Italian pasta dishes',
  //       isActive: true,
  //       order: 1,
  //       userId: '2a80f40e-5113-46a1-ade5-20433f9d6a38',
  //       parentId: categories[0].id, // Main Courses
  //     },
  //   }),
  //   prisma.menuCategory.create({
  //     data: {
  //       name: 'Pizza',
  //       description: 'Authentic Italian pizzas',
  //       isActive: true,
  //       order: 2,
  //       userId: '2a80f40e-5113-46a1-ade5-20433f9d6a38',
  //       parentId: categories[0].id, // Main Courses
  //     },
  //   }),
  //   // Subcategories for Appetizers
  //   prisma.menuCategory.create({
  //     data: {
  //       name: 'Salads',
  //       description: 'Fresh and healthy salads',
  //       isActive: true,
  //       order: 1,
  //       userId: '2a80f40e-5113-46a1-ade5-20433f9d6a38',
  //       parentId: categories[1].id, // Appetizers
  //     },
  //   }),
  //   prisma.menuCategory.create({
  //     data: {
  //       name: 'Soups',
  //       description: 'Hot and cold soups',
  //       isActive: true,
  //       order: 2,
  //       userId: '2a80f40e-5113-46a1-ade5-20433f9d6a38',
  //       parentId: categories[1].id, // Appetizers
  //     },
  //   }),
  // ])


  
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 