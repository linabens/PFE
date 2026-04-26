const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Coffee Time API',
      version: '1.0.0',
      description: 'Full-stack multiservice coffee shop application API documentation',
      contact: {
        name: 'Coffee Time Dev Team',
        url: 'https://coffeetime.local',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
      {
        url: 'https://api.coffeetime.com',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for admin/staff authentication',
        },
        sessionToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-session-token',
          description: 'Session token for customer authentication',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            statusCode: { type: 'integer' },
            details: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            full_name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['client', 'staff', 'admin'] },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'staff@coffeetime.com' },
            password: { type: 'string', example: 'secure123' },
          },
        },
        Session: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            table_id: { type: 'integer' },
            token: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            last_active_at: { type: 'string', format: 'date-time' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', format: 'decimal' },
            category_id: { type: 'integer' },
            category_name: { type: 'string' },
            image_url: { type: 'string' },
            is_active: { type: 'boolean' },
            is_trending: { type: 'boolean' },
            is_seasonal: { type: 'boolean' },
            options: {
              type: 'object',
              properties: {
                size: { type: 'array' },
                milk: { type: 'array' },
                sugar: { type: 'array' },
                addon: { type: 'array' },
              },
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['drink', 'dessert'] },
            display_order: { type: 'integer' },
            product_count: { type: 'integer' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            table_id: { type: 'integer' },
            table_number: { type: 'integer' },
            session_id: { type: 'integer' },
            status: { type: 'string', enum: ['new', 'brewing', 'preparing', 'ready', 'completed'] },
            total_price: { type: 'number', format: 'decimal' },
            loyalty_used: { type: 'boolean' },
            items: { type: 'array' },
            created_at: { type: 'string', format: 'date-time' },
            completed_at: { type: 'string', format: 'date-time' },
          },
        },
        AssistanceRequest: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            table_id: { type: 'integer' },
            table_number: { type: 'integer' },
            status: { type: 'string', enum: ['pending', 'handled'] },
            requested_at: { type: 'string', format: 'date-time' },
            handled_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'Login and authentication endpoints' },
      { name: 'Sessions', description: 'Customer session management' },
      { name: 'Products', description: 'Product browsing and management' },
      { name: 'Categories', description: 'Category management' },
      { name: 'Orders', description: 'Order management' },
      { name: 'Assistance', description: 'Call waiter functionality' },
      { name: 'Games', description: 'Games and entertainment' },
      { name: 'News', description: 'RSS news feeds' },
      { name: 'Entertainment', description: 'Quotes, tips, and videos' },
      { name: 'Admin', description: 'Admin dashboard and analytics' },
    ],
  },
  apis: [
    './src/routes/authRoutes.js',
    './src/routes/sessionRoutes.js',
    './src/routes/productRoutes.js',
    './src/routes/categoryRoutes.js',
    './src/routes/orderRoutes.js',
    './src/routes/assistanceRoutes.js',
    './src/routes/gameRoutes.js',
    './src/routes/newsRoutes.js',
    './src/routes/entertainmentRoutes.js',
    './src/routes/adminRoutes.js',
  ],
};

module.exports = swaggerJsdoc(options);
