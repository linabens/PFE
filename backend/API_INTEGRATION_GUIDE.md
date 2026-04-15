# API Integration Guide for Frontend/Mobile

## Table Management & Session Flow

### 1. QR Code Scanning (Customer Entry Point)

When a customer scans the QR code on a table, extract `table_id` from the QR and create a session:

```javascript
// POST /api/sessions
const response = await fetch('http://localhost:3000/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ table_id: 1 })
});
const { data } = await response.json();
const sessionToken = data.token; // Store this for all subsequent requests
```

### 2. Customer Session Headers

Every customer request (orders, assistance, games) must include the session token:

```javascript
const headers = {
  'Content-Type': 'application/json',
  'x-session-token': sessionToken
};
```

Alternative: pass as query parameter `?session_token=...`

## Public Endpoints (Customers)

### Browse Menu

```javascript
// Get all products
GET /api/products

// Filter by category
GET /api/products?category_id=1

// Get trending products
GET /api/products?is_trending=true

// Get product details with options
GET /api/products/:id
```

### Get Categories

```javascript
GET /api/categories
```

### Place Order

```javascript
POST /api/orders
{
  "table_id": 1,
  "items": [
    {
      "product_id": 11,
      "quantity": 2,
      "options": [
        { "option_name": "Large", "price_modifier": 0.5 },
        { "option_name": "Almond Milk", "price_modifier": 0 }
      ]
    }
  ],
  "loyalty_used": false
}

// Response: { success: true, data: { id, total_price, status, items: [...] } }
```

### Track Order Status

```javascript
GET /api/orders/:orderid

// Response: { success: true, data: { id, status, items, total_price } }
// Status: new | brewing | preparing | ready | completed
```

### Call Waiter

```javascript
POST /api/assistance
{
  // table_id is auto-populated from session
}

// Response: { success: true, data: { id, table_number, status: 'pending' } }
```

### Browse Games

```javascript
GET /api/games

// Play a game
POST /api/games/:id/play
{
  "score": 150,
  "reward_points": 10
}

// Get high scores
GET /api/games/:id/scores?limit=10
```

### Entertainment

```javascript
// Random quotes
GET /api/entertainment/quotes?limit=5

// Productivity tips
GET /api/entertainment/tips?limit=3

// Short vertical videos
GET /api/entertainment/videos?limit=10
```

### News

```javascript
GET /api/news?category=general&limit=20
// Categories: general, sports, technology
```

## Admin Endpoints (Staff/Admin Only)

### Login

```javascript
POST /api/auth/login
{
  "email": "staff@coffeechain.com",
  "password": "securePassword123"
}

// Response: { success: true, data: { user, token } }
// Store token for all admin requests
```

### Admin Headers

```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${jwtToken}`
};
```

### Dashboard

```javascript
GET /api/admin/dashboard

// Response includes:
{
  "total_orders": 42,
  "total_revenue": 1250.50,
  "avg_prep_time": 8.5,
  "pending_assistance": 3,
  "active_orders": 12,
  "top_products": [...]
}
```

### Peak Hours Analysis

```javascript
GET /api/admin/peak-hours?date=2026-03-04

// Response: [
//   { hour: 9, order_count: 5, revenue: 120.50 },
//   { hour: 10, order_count: 12, revenue: 280.75 }
// ]
```

### Product Sales Data

```javascript
GET /api/admin/product-sales?productId=11&startDate=2026-03-01&endDate=2026-03-04

// Response: [
//   { date: '2026-03-01', quantity_sold: 15, revenue: 120.50 },
//   { date: '2026-03-02', quantity_sold: 18, revenue: 145.00 }
// ]
```

### Daily Statistics

```javascript
GET /api/admin/daily-stats?startDate=2026-03-01&endDate=2026-03-04

// Response: [
//   { date: '2026-03-01', total_orders: 32, total_revenue: 850.00 }
// ]
```

### Manage Orders

```javascript
// Get orders by table
GET /api/orders/table/:tableId

// Get all active orders (kitchen display)
GET /api/orders/active/list

// Update order status
PATCH /api/orders/:id/status
{
  "status": "brewing" // new | brewing | preparing | ready | completed
}
```

### Manage Assistance Requests

```javascript
// Get all pending requests
GET /api/assistance/pending

// Mark request as handled
PATCH /api/assistance/:id/handle
```

### Manage Products

```javascript
// Create
POST /api/products
{
  "name": "Cappuccino",
  "category_id": 1,
  "price": 4.50,
  "description": "Espresso with steamed milk",
  "is_active": true,
  "is_trending": false
}

// Update
PATCH /api/products/:id
{
  "price": 5.00,
  "is_trending": true
}

// Delete
DELETE /api/products/:id
```

### Manage Categories

```javascript
// Create
POST /api/categories
{
  "name": "Hot Drinks",
  "type": "drink",
  "display_order": 1
}

// Update
PATCH /api/categories/:id
{
  "display_order": 2
}

// Delete
DELETE /api/categories/:id
```

## Error Handling

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Descriptive error message",
  "statusCode": 400,
  "details": null,
  "timestamp": "2026-03-04T10:00:00Z"
}
```

### Common Status Codes

- **400** – Bad Request (missing/invalid parameters)
- **401** – Unauthorized (invalid/expired token or session)
- **403** – Forbidden (insufficient privileges)
- **404** – Not Found (resource doesn't exist)
- **409** – Conflict (duplicate entry, already exists)
- **500** – Internal Server Error

## Best Practices

1. **Always store session token** in localStorage/AsyncStorage after QR scan
2. **Include token in every customer request** via header or query
3. **Handle token expiry** – automatically re-scan QR or re-login
4. **Validate response.success** before accessing response.data
5. **Implement proper error UI** showing response.message
6. **Cache products/categories** but refresh on app open
7. **Poll order status** every 2-3 seconds during wait
8. **Show pending assistance count** to staff in real-time

## Example: Full Customer Flow

```javascript
// 1. QR Scan → Create Session
const sessionRes = await fetch('/api/sessions', {
  method: 'POST',
  body: JSON.stringify({ table_id: 1 })
});
const { token } = (await sessionRes.json()).data;
localStorage.setItem('sessionToken', token);

// 2. Browse Menu
const productsRes = await fetch('/api/products', {
  headers: { 'x-session-token': token }
});
const products = (await productsRes.json()).data;

// 3. Place Order
const orderRes = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'x-session-token': token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    items: [{ product_id: 11, quantity: 1, options: [] }]
  })
});
const order = (await orderRes.json()).data;

// 4. Poll for status
const pollStatus = setInterval(async () => {
  const statusRes = await fetch(`/api/orders/${order.id}`, {
    headers: { 'x-session-token': token }
  });
  const { status } = (await statusRes.json()).data;
  if (status === 'ready') {
    clearInterval(pollStatus);
    showNotification('Your order is ready!');
  }
}, 3000);
```
