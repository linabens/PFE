# Coffee Time Backend API

Comprehensive backend for a full-stack multiservice coffee shop application with Node.js, Express, and PostgreSQL.

## Architecture

### Core Modules
1. **Ordering System** – Product browsing, cart management, order placement, status tracking, and invoice generation
2. **Entertainment Module** – Games, quotes, tips, and video content for customers during wait time
3. **News Module (RSS Aggregator)** – Real-time Arabic news from Al Jazeera, Al Arabiya
4. **Admin Dashboard** – Staff/admin access for order and analytics management

### Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 12+
- **Authentication**: JWT for staff/admin; session tokens for customers
- **Logging**: Winston

## Project Structure

```
backend/
├── src/
│   ├── server.js                 # Entry point
│   ├── config/                   # Configuration
│   ├── models/                   # Data access layer
│   ├── services/                 # Business logic
│   ├── controllers/              # Request handlers
│   ├── routes/                   # API endpoints
│   ├── middleware/               # Auth, session, error handling
│   ├── utils/                    # Helpers, errors, logger
│   └── database/                 # Migrations, seeds, schema
├── package.json
└── .env                          # Environment variables
```

## API Endpoints

### Public Endpoints (No Auth)

#### Sessions
- `POST /api/sessions`                    – Create session for a table

#### Products & Categories
- `GET /api/products`                     – List all products
- `GET /api/products/:id`                 – Get product details
- `GET /api/categories`                   – List all categories

#### Orders (Session-based)
- `POST /api/orders`                      – Create order (requires session token)
- `GET /api/orders/:id`                   – Get order details (session-scoped)

#### Assistance (Session-based)
- `POST /api/assistance`                  – Call waiter (requires session token)

#### Games (Public List)
- `GET /api/games`                        – List active games

#### News & Entertainment
- `GET /api/news?category=general`        – Fetch RSS news
- `GET /api/entertainment/quotes`         – Get motivational quotes
- `GET /api/entertainment/tips`           – Get productivity tips
- `GET /api/entertainment/videos`         – Get short videos

### Admin Endpoints (JWT + RBAC)

#### Authentication
- `POST /api/auth/login`                  – Admin/staff login

#### Admin Dashboard
- `GET /api/admin/dashboard`              – Daily summary
- `GET /api/admin/peak-hours`             – Peak hours analysis
- `GET /api/admin/product-sales`          – Product sales data
- `GET /api/admin/daily-stats`            – Daily statistics

#### Admin Order Management
- `GET /api/orders/table/:tableId`        – Orders by table
- `GET /api/orders/active/list`           – All active orders
- `PATCH /api/orders/:id/status`          – Update order status

#### Admin Assistance Management
- `GET /api/assistance/pending`           – Pending assistance requests
- `PATCH /api/assistance/:id/handle`      – Mark request as handled

#### Product & Category Management
- `POST /api/products`                    – Create product
- `PATCH /api/products/:id`               – Update product
- `DELETE /api/products/:id`              – Delete product
- `POST /api/categories`                  – Create category
- `PATCH /api/categories/:id`             – Update category
- `DELETE /api/categories/:id`            – Delete category

## Authentication & Authorization

### Customer (Anonymous)
- QR code scans table → automatic session creation
- Session token sent in `x-session-token` header
- Session-scoped access to orders/assistance

### Admin/Staff
- JWT login via `/api/auth/login`
- Bearer token in `Authorization` header
- Role-based access control: `staff` or `admin`

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_shop
DB_USER=postgres
DB_PASSWORD=your_password

# Security
JWT_SECRET=your-secret-key-change-in-production

# Logging
LOG_LEVEL=info
```

## Installation & Setup

```bash
# Install dependencies
npm install

# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed

# Development
npm run dev

# Production
npm start
```

## Database Schema

Key tables:
- `users` – Staff/admin accounts (with password_hash and roles)
- `sessions` – Anonymous customer sessions linked to tables
- `tables` – Coffee shop tables with QR codes
- `categories` – Product categories (drink, dessert)
- `products` – Menu items with pricing and metadata
- `product_options` – Customization options (size, milk, sugar, addon)
- `orders` – Customer orders linked to sessions/tables
- `order_items` – Line items in orders
- `order_item_options` – Selected options per item
- `assistance_requests` – Call waiter functionality
- `games` – Available games
- `game_sessions` – Game play records with scores
- `loyalty_accounts` – Loyalty points accounts
- `daily_stats` – Daily aggregated statistics

## Error Handling

All endpoints return consistent JSON responses:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-03-04T10:00:00Z"
}
```

Error responses include:
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400,
  "timestamp": "2026-03-04T10:00:00Z"
}
```

## Development Notes

- All customer-facing endpoints require session token from `/api/sessions`
- Admin endpoints require JWT token from `/api/auth/login`
- Services layer encapsulates business logic; models handle DB access
- Controllers delegate to services; routes handle HTTP concerns
- Middleware chain: CORS → parsing → session/auth → route → error handler

## Future Enhancements

- WebSocket support for real-time order status updates
- Push notifications for order ready/assistance
- Payment integration
- Advanced analytics & reporting
- Mobile app-specific endpoints
- Rate limiting & throttling
