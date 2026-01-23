# Menu Order SaaS

A production-ready MVP SaaS for restaurants in Egypt that allows restaurants to upload their menu and receive customer orders via WhatsApp.

## Features

- **Multi-tenant**: Each restaurant has its own public menu URL and owner dashboard
- **Bilingual**: Full Arabic/English support with RTL
- **WhatsApp Orders**: Customers place orders that generate WhatsApp messages
- **Owner Dashboard**: Manage menu, view orders, update settings
- **Mobile-first**: Responsive design optimized for mobile devices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: NestJS, TypeScript, REST APIs, Swagger
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (access + refresh tokens), bcrypt
- **Storage**: Cloudinary (optional, falls back to local)

## Project Structure

```
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── packages/
│   └── shared/       # Shared types, schemas, helpers
├── docker-compose.yml
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Docker & Docker Compose (for database)

### Development Setup

1. **Clone and install dependencies**

```bash
cd menu-order-saas
pnpm install
```

2. **Set up environment variables**

```bash
# API
cp apps/api/.env.example apps/api/.env

# Web
cp apps/web/.env.example apps/web/.env
```

3. **Start the database**

```bash
docker-compose up -d postgres
```

4. **Run database migrations**

```bash
cd apps/api
npx prisma migrate dev
```

5. **Seed the database** (creates demo restaurant)

```bash
cd apps/api
npx prisma db seed
```

6. **Start development servers**

```bash
# From root directory
pnpm dev

# Or start individually:
# Terminal 1 - API
cd apps/api && pnpm dev

# Terminal 2 - Web
cd apps/web && pnpm dev
```

7. **Access the application**

- Frontend: http://localhost:3000
- API: http://localhost:4000
- Swagger Docs: http://localhost:4000/docs
- Demo Menu: http://localhost:3000/r/shawarma-palace

### Demo Credentials

- **Email**: owner@shawarma-palace.com
- **Password**: password123

## Docker Deployment

Run everything with Docker Compose:

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- NestJS API server
- Next.js frontend

## API Endpoints

### Authentication
- `POST /auth/register` - Register new restaurant owner
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout

### Restaurant (Protected)
- `GET /restaurant/me` - Get current restaurant
- `PUT /restaurant/me` - Update restaurant settings
- `GET /restaurant/analytics` - Get dashboard analytics

### Categories (Protected)
- `GET /categories` - List categories
- `POST /categories` - Create category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### Items (Protected)
- `GET /items` - List items
- `POST /items` - Create item
- `PUT /items/:id` - Update item
- `DELETE /items/:id` - Delete item
- `PATCH /items/:id/toggle-availability` - Toggle availability

### Orders (Protected)
- `GET /orders` - List orders (last 30 days)
- `GET /orders/:id` - Get order details
- `PATCH /orders/:id/status` - Update order status
- `GET /orders/:id/whatsapp` - Get WhatsApp message

### Public
- `GET /public/restaurants/:slug` - Get restaurant with menu
- `POST /public/restaurants/:slug/orders` - Create order

## Environment Variables

### API (.env)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/menu_saas"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=4000
FRONTEND_URL="http://localhost:3000"

# Optional: Cloudinary for image uploads
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

### Web (.env)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Extending to WhatsApp Business API

The current implementation uses WhatsApp click-to-chat links (`wa.me`). To upgrade to WhatsApp Business API:

1. **Register for WhatsApp Business API** through Meta Business Suite

2. **Update the order notification system** in `apps/api/src/orders/orders.service.ts`:

```typescript
// Replace the generateWhatsAppUrl call with:
await this.whatsappService.sendMessage({
  to: restaurant.phone,
  template: 'order_notification',
  parameters: [
    order.orderNumber,
    order.customerName,
    order.total,
  ],
});
```

3. **Create a WhatsApp service** with the official API:

```typescript
@Injectable()
export class WhatsAppService {
  async sendMessage(params: WhatsAppMessageParams) {
    // Implement using @whatsapp-cloud/api or similar
  }
}
```

## Adding SMS Support

To add SMS as secondary notification:

1. **Install Twilio SDK**:
```bash
pnpm add twilio
```

2. **Create SMS service**:

```typescript
@Injectable()
export class SmsService {
  private client: Twilio;

  constructor(private config: ConfigService) {
    this.client = new Twilio(
      config.get('TWILIO_SID'),
      config.get('TWILIO_AUTH_TOKEN')
    );
  }

  async sendOrderNotification(to: string, message: string) {
    await this.client.messages.create({
      body: message,
      from: this.config.get('TWILIO_PHONE'),
      to: `+2${to}`, // Egypt country code
    });
  }
}
```

3. **Add to order creation flow**:

```typescript
if (restaurant.smsEnabled) {
  await this.smsService.sendOrderNotification(
    restaurant.phone,
    messages.en // or messages.ar
  );
}
```

## Testing Checklist

### Public Menu (Customer Flow)
- [ ] Open restaurant page `/r/shawarma-palace`
- [ ] View menu categories and items
- [ ] Add items to cart
- [ ] Adjust quantities in cart
- [ ] Remove items from cart
- [ ] Proceed to checkout
- [ ] Fill delivery details (use Egyptian phone format: 01XXXXXXXXX)
- [ ] Place order
- [ ] Click WhatsApp button to send order

### Owner Dashboard
- [ ] Register new account
- [ ] Login with credentials
- [ ] View dashboard analytics
- [ ] Create/edit/delete categories
- [ ] Create/edit/delete menu items
- [ ] Upload item images
- [ ] Toggle item availability
- [ ] View orders list
- [ ] Update order status
- [ ] Re-send WhatsApp for any order
- [ ] Update restaurant settings
- [ ] Change business hours

### Language Support
- [ ] Toggle English/Arabic on public pages
- [ ] Verify RTL layout in Arabic mode
- [ ] Check Arabic content displays correctly
- [ ] Dashboard language toggle works

### Edge Cases
- [ ] Minimum order validation
- [ ] Phone number validation (Egyptian format)
- [ ] Empty cart handling
- [ ] Restaurant not found (404)
- [ ] Session persistence after refresh
- [ ] Cart persistence in localStorage

## License

MIT
