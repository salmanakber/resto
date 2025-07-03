# Context.md

## Overview

We are improving the existing **kitchen staff** system with slight design improvements and upgrading it into a full **Employee Module**.

The base design and database connection (MySQL via Prisma) already exist. Your task is to extend, refine, and carefully implement the following changes.

---

## Objectives

### 1. Rename Module

- Change all mentions of **Kitchen Staff** to **Employee Module** across the restaurants folder.

### 2. Role Table Modification

- Add a new column to the existing `role` table:
  - Column name: `access_area`
  - This will store the access areas/permissions set by the Admin for each employee.

### 3. Employee Permissions

- While adding a new employee, Admin must assign permissions.
- The permissions are defined as:
  #### Permission Levels:
  - **Clerk / Waiter**
    - Manage POS
    - Modify Order
    - Kitchen Display Screen
  - **Assist / Supervisor**
    - Manage POS
    - Modify Order
    - Kitchen Display Screen
    - Kitchen Dashboard
  - **Manager / Senior**
    - Manage POS
    - Modify Order
    - Kitchen Display Screen
    - Kitchen Dashboard
    - Employee Module Access
    - Delete Order
  - **Owner / Head**
    - Manage POS
    - Modify Order
    - Kitchen Display Screen
    - Kitchen Dashboard
    - Restaurant Dashboard
    - Employee Module Access
    - Delete Order
    - Setup IT Department Access
      - *Note:* IT Department access must include a **time expiry** feature where the account will auto-delete after the set expiry.
      - For now, create a **separate menu** under Employee Module to manage IT Department access.

---

### 4. Reporting for Employees

- Every employee role/user will have their own **Reporting Page**.
- Reports must support **PDF export**.

### 5. Invoicing & HRM Reporting

- Add a **Reporting and Invoicing Portal** inside the Employee Module.
- Admin should be able to:
  - Generate Employee Invoices
  - monthely / weekly / yearly reports
  - Generate HRM-style Reports for Employees

---

## Technical Requirements

- **Database:** MySQL (Prisma connected)
- **Existing Files:** Review the `database/Prisma` folder (especially `schema.prisma` and `.env`) to understand existing tables before making changes.
- **API Structure:** All new APIs must be created inside `/api/restaurants/`.

---

## Important Notes

- Make only **minor design improvements**; the core design should remain intact.
- **Carefully implement** all features and details mentioned above.
- Maintain **clean**, **organized**, and **scalable** code.
- Integrate new features **seamlessly** with the existing system.

