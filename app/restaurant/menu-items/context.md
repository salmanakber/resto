# Detailed Task Specification for Menu Item Management System

## 1. Convert Popup Modal to Dedicated Page

**Current Behavior:**
- Menu items are currently managed through a popup modal for both adding and updating.

**Required Changes:**
- Replace the popup modal with a standalone page for:
  - Adding new menu items.
  - Editing existing menu items.
  
**Details:**
- The page should be fully responsive and user-friendly.
- Maintain consistency in UI/UX with other parts of the admin panel.
- Ensure routing is set up to handle `/menu/add` for adding and `/menu/edit/:id` for editing menu items.

---

## 2. Create API Endpoints for Menu Items

**Required Endpoints:**
- `POST /api/restaurant/menu/add` – Endpoint to add a new menu item.
- `PUT /api/restaurant/menu/edit/:id` – Endpoint to edit an existing menu item.
- `DELETE /api/restaurant/menu/delete/:id` – Endpoint to delete a menu item.
- `GET /api/restaurant/menu/list` – Endpoint to fetch a list of all menu items for the currently logged-in user/admin.

**Security & Authentication:**
- Use session-based authentication for all endpoints.
- Ensure actions like add, edit, delete, and fetch can only be performed by authenticated users.
- Proper error handling should be implemented for each endpoint, with validation for input data.

---

## 3. Database Table for Menu Items

**Details:**
- A new database table should be created to store information about menu items.
- The table should support basic fields such as:
  - Title, description, price, image, and category and more...
  - A link to services that can be associated with menu items (e.g., extra cheese, spiciness level).
  - Created by (user) and timestamp fields.

---

## 4. Category Selection (with Multi-level Support)

**Current Category Structure:**
- Categories are stored in the database MenuCategory table and it has multiple levels (e.g., Food > Fast Food > Burgers using parentId column).

**Required Changes:**
- When adding or editing a menu item, the category selection should support multi-level categories.
- The admin should be able to select categories from a tree-like structure or multi-level dropdown that shows all available categories and their hierarchical relationships.

---

## 5. Services Selection and Dynamic Saving

**Service Concept:**
- Each menu item can have optional “services” or “modifiers” (e.g., “Extra Spicy,” “Double Cheese”).

**Required Changes:**
- The admin should be able to select from a list of predefined services when adding or editing a menu item.
- Admins should also have the option to add new services on the fly if they don’t already exist in the list.
- Newly added services should be saved to the database for future use with other menu items.
- i am sure for this you need to create table for services too

**Note:**
- Ensure services are reusable in the future, and that every time a service is added, it’s stored in the database for reuse on other menu items make sure do not store duplicate services.

---

## 6. Feedback/Review System Integration

**Current State:**
- There is no existing table for storing user feedback or reviews for menu items.

**Required Changes:**
- A new feedback/review table needs to be created in the database to store user ratings and comments for each menu item.
- The feedback system should include:
  - A rating (1-5).
  - An optional comment field.
  - A reference to the menu item being reviewed and the user who provided the feedback.

**Note:**
- This will allow users to leave reviews for menu items, and admins can view and manage this feedback.

---

## 7. Session-Based API Access

**Security Considerations:**
- All API operations related to adding, editing, or deleting menu items should be restricted based on the current session.
- The session should be validated to ensure that only the logged-in user or admin can perform actions on the menu items.
- Unauthorized users should not be allowed to access, modify, or delete data that does not belong to them.

**Note:**
- Use middleware or session-check logic to ensure proper access control and data security.

---

## General Notes

- Ensure all features are thoroughly tested for edge cases and usability.
- Follow best practices for both backend and frontend code for maintainability and scalability.
- Implement proper error messages and validation for forms (both client-side and server-side).
- Make sure the user interface is intuitive and consistent with the rest of the admin panel design.
- Keep the code modular and clean, making it easier to extend in the future.

