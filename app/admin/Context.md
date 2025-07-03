# Admin Panel Development Context for Prisma Schema

## Overview

This document defines the **admin panel development context** for the provided Prisma schema. The admin side will offer control over users, roles, settings, orders, locations, restaurants, and other business logic. This context guides backend and frontend development priorities, API design, and access control.

---

## Admin Panel Scope

### Core Admin Responsibilities:

* **User Management**

  * View all users (filter by role, email, status)
  * CRUD for user roles and permissions
  * Activate/deactivate or delete users
  * View login logs

* **Role Management**

  * Manage roles with access area definitions (`access_area` field)

* **Location Management**

  * Admin can add, update, and delete **Locations**
  * Each restaurant is linked to a specific Location via relations (`restaurantId`, `Location`)

* **Restaurant Management**

  * Restaurants are created and assigned to specific Locations
  * Admin can view all restaurants in all locations
  * Admin has the ability to **impersonate/login** to any restaurant by clicking a "Login" button in the admin panel

* **Order Oversight**

  * Admin can view all orders from all restaurants
  * Admin dashboard displays performance data per restaurant: total orders, revenue, order trends, etc.

* **Dashboard Reports**

  * A central dashboard with:

    * Charts and graphs (e.g., bar, pie, line)
    * KPIs: active restaurants, order volume, earnings
    * Filter by location, restaurant, time frame

* **Settings Control**

  * The `Setting` table is central to system-wide configuration
  * Admin can manage settings such as:

    * Email/SMS/OTP options
    * Currency, tax, payment gateway config
    * Loyalty system and thresholds
    * Social logins and OTP settings
  * Settings are stored as key-value pairs
  * JSON values are used for complex structures (e.g., `loyalty`, `twilio`, `company`, `currency`, `paymentGateway`, `taxes`)

* **Email & SMS Templates**

  * Dynamic email and SMS templates with placeholders like `{{otp}}`, `{{orderId}}`
  * CRUD for templates in the admin panel

* **Menu Management**

  * Manage categories and items (CRUD)
  * Set availability, sort order, popularity

* **Customer Management**

  * View customer data, loyalty points, last order date

* **Payment Overview**

  * View or deactivate payment methods used by users

* **Activity Logs**

  * Admins can review login logs and OTP usage

---

## Settings Table (Core Logic)

The `Setting` table uses a flexible key/value system with optional JSON objects to store configuration like:

| Key                                                    | Purpose                            | Format                |
| ------------------------------------------------------ | ---------------------------------- | --------------------- |
| `email_verification_required`                          | Enforce email verification         | `true/false`          |
| `loyalty`                                              | Loyalty rules (JSON)               | `{earnRate:1}`        |
| `currency`                                             | App currency and symbol set (JSON) | `{USD: {...}}`        |
| `paymentGateway`                                       | Stripe, PayPal, etc. (JSON)        | `{credential: {...}}` |
| `company`                                              | Branding info (JSON)               | `{name, logo}`        |
| `OTP_LENGTH`, `OTP_EXPIRY_MINUTES`, `OTP_MAX_ATTEMPTS` | OTP rules                          | Plain values          |

> Many keys contain nested structures for maximum flexibility.

---

## Color
* primary color RedRose

## Authentication & Access Control

* Admin login via User table
* Access protected by role and `access_area`
* Admins can impersonate restaurant users for troubleshooting

---

## Suggested APIs

| Resource                 | Operations                                   |
| ------------------------ | -------------------------------------------- |
| `/admin/users`           | List, Create, Update, Delete, Reset Password |
| `/admin/roles`           | CRUD                                         |
| `/admin/locations`       | CRUD                                         |
| `/admin/restaurants`     | List, Assign Location, Impersonate Login     |
| `/admin/orders`          | View Orders by Restaurant, View Performance  |
| `/admin/menu`            | Manage Categories & Items                    |
| `/admin/settings`        | Full config editor                           |
| `/admin/email-templates` | CRUD & Preview                               |
| `/admin/customers`       | View Loyalty Data                            |
| `/admin/logins`          | Activity Logs                                |

---

## UI Navigation Structure (Suggested)

* Dashboard (Performance overview)
* Users
* Roles
* Locations
* Restaurants
* Orders
* Menu
* Customers
* Settings
* Email/SMS Templates
* Logs

* You are open to add more feature 

---

## Admin-Only Features

* Restaurant impersonation login
* Location assignment to restaurants
* Setting editing (includes JSON parsing)
* Global performance charts

---

## Future Enhancements

* Export reports as CSV/Excel
* Geo mapping of locations
* Settings version history/audit
* Drag-and-drop access\_area builder
* GraphQL admin interface (optional)

---

This context provides a blueprint for building the full-featured admin dashboard to manage your Prisma-powered platform. Let me know if you want a modular API scaffold or Next.js/React frontend planning next.
