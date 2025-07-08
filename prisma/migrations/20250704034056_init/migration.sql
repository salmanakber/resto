-- CreateEnum
CREATE TYPE "leaveType" AS ENUM ('SickLeave', 'AnnualLeave', 'UnpaidLeave', 'Other');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "restaurantName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "roleId" TEXT NOT NULL,
    "profileImage" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "phoneNumber" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "otp" TEXT,
    "cuisine" TEXT,
    "otpExpires" TIMESTAMP(3),
    "otpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "googleId" TEXT,
    "facebookId" TEXT,
    "otpAttempts" INTEGER NOT NULL DEFAULT 0,
    "restaurantId" TEXT,
    "locationId" TEXT,
    "customerType" TEXT,
    "stripeCustomerId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayName" TEXT NOT NULL,
    "access_area" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "device" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "variables" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gender" TEXT,
    "preferences" TEXT,
    "language" TEXT DEFAULT 'en',
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "streetAddress" TEXT NOT NULL,
    "apartment" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT,
    "totalSpent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "lastOrderDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "restaurantId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentMethodId" TEXT,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "cardNumber" TEXT NOT NULL,
    "expiryMonth" INTEGER NOT NULL,
    "expiryYear" INTEGER NOT NULL,
    "cardHolderName" TEXT NOT NULL,
    "billingAddress" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripeCustomerId" TEXT,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "restaurantId" TEXT NOT NULL,
    "dineInCustomer" TEXT,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethodId" TEXT,
    "shippingAddress" TEXT NOT NULL,
    "billingAddress" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "notes" TEXT,
    "trackingNumber" TEXT,
    "estimatedDelivery" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tableId" TEXT,
    "paymentDetails" JSONB,
    "customerDetails" JSONB,
    "orderType" TEXT,
    "pickupTime" TEXT,
    "discountUsed" JSONB,
    "specialInstructions" TEXT,
    "otp" TEXT,
    "qrCode" TEXT,
    "locationId" TEXT,
    "customerId" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loginLogId" TEXT,
    "expires" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER DEFAULT 0,
    "parentId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "image" TEXT,
    "tags" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "calories" INTEGER,
    "order" INTEGER,
    "prepTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemService" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItemService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemReview" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "orderId" TEXT,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT,

    CONSTRAINT "MenuItemReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ITAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ITAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "restaurantId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "position" TEXT,
    "department" TEXT,
    "typeLeave" "leaveType",
    "tempStatus" TEXT,
    "note" TEXT,
    "salary" DECIMAL(10,2) NOT NULL,
    "hireDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaveStartDate" TIMESTAMP(3),
    "leaveEndDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payroll" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "baseSalary" DECIMAL(10,2) NOT NULL,
    "overtimePay" DECIMAL(10,2) NOT NULL,
    "tipsAmount" DECIMAL(10,2) NOT NULL,
    "deductions" DECIMAL(10,2) NOT NULL,
    "netSalary" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentDate" TIMESTAMP(3),
    "payslipUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Overtime" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "payrollId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "hours" DECIMAL(10,2) NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Overtime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tip" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "payrollId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deduction" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "payrollId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" TEXT NOT NULL DEFAULT '0',
    "lng" TEXT NOT NULL DEFAULT '0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "qrCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "restaurantId" TEXT NOT NULL,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitchenOrder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "staffId" TEXT,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitchenOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyPoint" (
    "id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL DEFAULT '1',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "orderNotifications" BOOLEAN NOT NULL DEFAULT true,
    "marketingNotifications" BOOLEAN NOT NULL DEFAULT false,
    "systemNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecuritySettings" (
    "id" TEXT NOT NULL DEFAULT '1',
    "twoFactorAuth" BOOLEAN NOT NULL DEFAULT false,
    "sessionTimeout" INTEGER NOT NULL DEFAULT 30,
    "passwordExpiry" INTEGER NOT NULL DEFAULT 90,
    "maxLoginAttempts" INTEGER NOT NULL DEFAULT 5,
    "ipWhitelist" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecuritySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT DATE_ADD(NOW(), INTERVAL 30 DAY),
    "restaurantId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "assignedTo" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT,
    "attachments" TEXT,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "tags" TEXT,
    "restaurantId" TEXT,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintResponse" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplaintResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "tags" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "SupportArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "tags" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleView" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleFeedback" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LocationRestaurants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LocationRestaurants_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_LocationUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LocationUsers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_facebookId_key" ON "User"("facebookId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "User_roleId_fkey" ON "User"("roleId");

-- CreateIndex
CREATE INDEX "User_locationId_idx" ON "User"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "LoginLog_userId_fkey" ON "LoginLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_name_key" ON "EmailTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "Address_userId_fkey" ON "Address"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phoneNumber_key" ON "Customer"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");

-- CreateIndex
CREATE INDEX "PaymentMethod_userId_fkey" ON "PaymentMethod"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_paymentMethodId_fkey" ON "Order"("paymentMethodId");

-- CreateIndex
CREATE INDEX "Order_userId_fkey" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_tableId_idx" ON "Order"("tableId");

-- CreateIndex
CREATE INDEX "Account_userId_fkey" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Session_userId_key" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_fkey" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "MenuCategory_parentId_idx" ON "MenuCategory"("parentId");

-- CreateIndex
CREATE INDEX "MenuCategory_userId_idx" ON "MenuCategory"("userId");

-- CreateIndex
CREATE INDEX "MenuItem_categoryId_idx" ON "MenuItem"("categoryId");

-- CreateIndex
CREATE INDEX "MenuItem_userId_idx" ON "MenuItem"("userId");

-- CreateIndex
CREATE INDEX "MenuItem_restaurantId_idx" ON "MenuItem"("restaurantId");

-- CreateIndex
CREATE INDEX "Service_userId_idx" ON "Service"("userId");

-- CreateIndex
CREATE INDEX "MenuItemService_menuItemId_idx" ON "MenuItemService"("menuItemId");

-- CreateIndex
CREATE INDEX "MenuItemService_serviceId_idx" ON "MenuItemService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemService_menuItemId_serviceId_key" ON "MenuItemService"("menuItemId", "serviceId");

-- CreateIndex
CREATE INDEX "MenuItemReview_menuItemId_idx" ON "MenuItemReview"("menuItemId");

-- CreateIndex
CREATE INDEX "MenuItemReview_userId_idx" ON "MenuItemReview"("userId");

-- CreateIndex
CREATE INDEX "ITAccess_userId_idx" ON "ITAccess"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_restaurantId_idx" ON "Employee"("restaurantId");

-- CreateIndex
CREATE INDEX "Employee_userId_idx" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Payroll_employeeId_idx" ON "Payroll"("employeeId");

-- CreateIndex
CREATE INDEX "Payroll_month_year_idx" ON "Payroll"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_employeeId_month_year_key" ON "Payroll"("employeeId", "month", "year");

-- CreateIndex
CREATE INDEX "Overtime_employeeId_idx" ON "Overtime"("employeeId");

-- CreateIndex
CREATE INDEX "Overtime_payrollId_idx" ON "Overtime"("payrollId");

-- CreateIndex
CREATE INDEX "Overtime_month_year_idx" ON "Overtime"("month", "year");

-- CreateIndex
CREATE INDEX "Tip_employeeId_idx" ON "Tip"("employeeId");

-- CreateIndex
CREATE INDEX "Tip_payrollId_idx" ON "Tip"("payrollId");

-- CreateIndex
CREATE INDEX "Tip_month_year_idx" ON "Tip"("month", "year");

-- CreateIndex
CREATE INDEX "Deduction_employeeId_idx" ON "Deduction"("employeeId");

-- CreateIndex
CREATE INDEX "Deduction_payrollId_idx" ON "Deduction"("payrollId");

-- CreateIndex
CREATE INDEX "Attendance_employeeId_idx" ON "Attendance"("employeeId");

-- CreateIndex
CREATE INDEX "Attendance_month_year_idx" ON "Attendance"("month", "year");

-- CreateIndex
CREATE INDEX "Location_userId_idx" ON "Location"("userId");

-- CreateIndex
CREATE INDEX "Table_restaurantId_idx" ON "Table"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "KitchenOrder_orderId_key" ON "KitchenOrder"("orderId");

-- CreateIndex
CREATE INDEX "KitchenOrder_restaurantId_idx" ON "KitchenOrder"("restaurantId");

-- CreateIndex
CREATE INDEX "KitchenOrder_assignedBy_idx" ON "KitchenOrder"("assignedBy");

-- CreateIndex
CREATE INDEX "KitchenOrder_staffId_idx" ON "KitchenOrder"("staffId");

-- CreateIndex
CREATE INDEX "LoyaltyPoint_userId_idx" ON "LoyaltyPoint"("userId");

-- CreateIndex
CREATE INDEX "LoyaltyPoint_orderId_idx" ON "LoyaltyPoint"("orderId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_restaurantId_idx" ON "Notification"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRecipient_notificationId_userId_key" ON "NotificationRecipient"("notificationId", "userId");

-- CreateIndex
CREATE INDEX "Complaint_userId_idx" ON "Complaint"("userId");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_type_idx" ON "Complaint"("type");

-- CreateIndex
CREATE INDEX "Complaint_category_idx" ON "Complaint"("category");

-- CreateIndex
CREATE INDEX "Complaint_createdAt_idx" ON "Complaint"("createdAt");

-- CreateIndex
CREATE INDEX "ComplaintResponse_complaintId_idx" ON "ComplaintResponse"("complaintId");

-- CreateIndex
CREATE INDEX "ComplaintResponse_userId_idx" ON "ComplaintResponse"("userId");

-- CreateIndex
CREATE INDEX "SupportArticle_category_idx" ON "SupportArticle"("category");

-- CreateIndex
CREATE INDEX "SupportArticle_isPublished_idx" ON "SupportArticle"("isPublished");

-- CreateIndex
CREATE INDEX "SupportArticle_createdAt_idx" ON "SupportArticle"("createdAt");

-- CreateIndex
CREATE INDEX "FAQ_category_idx" ON "FAQ"("category");

-- CreateIndex
CREATE INDEX "FAQ_isPublished_idx" ON "FAQ"("isPublished");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_idx" ON "ActivityLog"("entityType");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleView_articleId_ipAddress_key" ON "ArticleView"("articleId", "ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleFeedback_articleId_ipAddress_key" ON "ArticleFeedback"("articleId", "ipAddress");

-- CreateIndex
CREATE INDEX "_LocationRestaurants_B_index" ON "_LocationRestaurants"("B");

-- CreateIndex
CREATE INDEX "_LocationUsers_B_index" ON "_LocationUsers"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey_pg" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginLog" ADD CONSTRAINT "LoginLog_userId_fkey_pg" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey_pg" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_userId_fkey_pg" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_paymentMethodId_fkey_pg" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey_pg" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey_pg" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey_pg" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_loginLogId_fkey_pg" FOREIGN KEY ("loginLogId") REFERENCES "LoginLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MenuCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemService" ADD CONSTRAINT "MenuItemService_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemService" ADD CONSTRAINT "MenuItemService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemReview" ADD CONSTRAINT "MenuItemReview_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemReview" ADD CONSTRAINT "MenuItemReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITAccess" ADD CONSTRAINT "ITAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Overtime" ADD CONSTRAINT "Overtime_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Overtime" ADD CONSTRAINT "Overtime_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deduction" ADD CONSTRAINT "Deduction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deduction" ADD CONSTRAINT "Deduction_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenOrder" ADD CONSTRAINT "KitchenOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenOrder" ADD CONSTRAINT "KitchenOrder_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenOrder" ADD CONSTRAINT "KitchenOrder_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenOrder" ADD CONSTRAINT "KitchenOrder_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyPoint" ADD CONSTRAINT "LoyaltyPoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyPoint" ADD CONSTRAINT "LoyaltyPoint_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintResponse" ADD CONSTRAINT "ComplaintResponse_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintResponse" ADD CONSTRAINT "ComplaintResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportArticle" ADD CONSTRAINT "SupportArticle_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportArticle" ADD CONSTRAINT "SupportArticle_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FAQ" ADD CONSTRAINT "FAQ_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FAQ" ADD CONSTRAINT "FAQ_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleView" ADD CONSTRAINT "ArticleView_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "SupportArticle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleFeedback" ADD CONSTRAINT "ArticleFeedback_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "SupportArticle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationRestaurants" ADD CONSTRAINT "_LocationRestaurants_A_fkey" FOREIGN KEY ("A") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationRestaurants" ADD CONSTRAINT "_LocationRestaurants_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationUsers" ADD CONSTRAINT "_LocationUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationUsers" ADD CONSTRAINT "_LocationUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
