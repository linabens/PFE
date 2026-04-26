# Dify Chatbot Backend Guide

A production-ready Node.js REST API with PostgreSQL, Prisma, JWT Authentication, Zod Validation, and Dify integration.

The source code for this backend has been completely scaffolded inside your workspace at: `c:\Users\HP\Desktop\PFE-main\dify-chatbot-backend`

---

## 1. Project Folder Structure

```text
dify-chatbot-backend/
├── prisma/
│   └── schema.prisma        (PostgreSQL tables: Users, Conversations, Messages)
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts  (Registration & Login)
│   │   └── chat.controller.ts  (Dify chat flow logic & Message saving)
│   ├── db/
│   │   └── prisma.ts           (PrismaClient instance)
│   ├── middlewares/
│   │   ├── auth.middleware.ts  (JWT check)
│   │   ├── error.middleware.ts (Global AppError & Zod handlers)
│   │   └── validate.middleware.ts (Zod request parser)
│   ├── models/
│   │   └── schemas.ts          (Zod validation blueprints)
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── chat.routes.ts
│   ├── services/
│   │   ├── db.service.ts       (Functions to fetch contextual data for Dify)
│   │   └── dify.service.ts     (Axios client calling api.dify.ai)
│   ├── utils/
│   │   ├── errors.ts           (Custom error classes)
│   │   └── jwt.ts              (Token signing/verifying)
│   └── index.ts                (Express app bootstrap & config)
├── .env
├── docker-compose.yml
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## 2. API Examples

### `POST /auth/register`
**Request:**
```json
{
  "email": "user@coffeetime.com",
  "password": "securepassword123"
}
```
**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": "uuid", "email": "user@coffeetime.com" },
    "token": "eyJhbGciOiJIUzI1..."
  }
}
```

### `POST /auth/login`
**Request:**
```json
{
  "email": "user@coffeetime.com",
  "password": "securepassword123"
}
```
**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "uuid", "email": "user@coffeetime.com" },
    "token": "eyJhbGciOiJIUzI1..."
  }
}
```

### `POST /chat/send`
*Requires `Authorization: Bearer <token>`*

**Request:**
```json
{
  "content": "What is the price of the Espresso?",
  "conversation_id": "optional-uuid-here" // Omitting creates a new conversation
}
```
**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "conversation_id": "uuid",
    "message": {
      "id": "msg-uuid",
      "conversation_id": "uuid",
      "role": "assistant",
      "content": "The Espresso costs $3.00.",
      "created_at": "2026-04-23T12:00:00.000Z"
    }
  }
}
```

---

## 3. Dashboard Integration Guide

Integrating this backend into your existing React Dash Admin or Brew Luna Native app is straightforward.

### How Frontend Calls Backend
You use standard `fetch` or `axios`. Set up a base instance pointing to `http://localhost:3000`.

### JWT Storage & Usage
1. On successful `/auth/login`, save the `token` in `localStorage` (React) or `SecureStore` (React Native).
2. For any `/chat/*` routes, intercept the request and attach the header:
   `Authorization: Bearer <stored_token>`

### Maintaining Conversation State
1. The first time a user opens the chat, don't pass a `conversation_id`.
2. The `POST /chat/send` response returns a `conversation_id`.
3. Store this ID in your frontend state/Redux.
4. Pass this saved `conversation_id` in subsequent POST requests to keep context.
5. You can fetch past messages via `GET /chat/history?conversation_id=...`.

**Example Fetch Call:**
```javascript
const sendMessage = async (text, conversationId) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/chat/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      content: text,
      conversation_id: conversationId // pass null/undefined for first message
    })
  });
  
  const result = await response.json();
  return result.data; // contains the bot's response and conversation_id
};
```

---

## 4. Deployment Steps

Using the provided `Dockerfile` and `docker-compose.yml`, deploying this to a VM (like DigitalOcean or AWS EC2) is incredibly simple.

**Step 1. Prepare Environment**
- Move the `dify-chatbot-backend` directory to your server.
- Edit `.env` with your real production `JWT_SECRET`, `DIFY_API_KEY`, and change DB passwords.

**Step 2. Spin up Database and Backend**
Run the following command from the project root:
```bash
docker-compose up -d
```
*This will pull PostgreSQL, build the Node/TypeScript image, install dependencies, and start the app.*

**Step 3. Run Prisma Migrations**
Once the containers are up, execute the migration inside the backend container to build the database tables:
```bash
docker-compose exec chatbot-backend npx prisma db push
```
*(Or `npx prisma migrate deploy` for full production migrations).*

Your backend is now running flawlessly on port 3000, connected to a resilient Postgres volume!
