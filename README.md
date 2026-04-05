# Finance Data Processing and Access Control Backend

A production-ready backend system for managing financial records with role-based access control, built with Node.js, TypeScript, Express.js, and Prisma ORM.

## Features

- **User Management**: Create and manage users with role-based permissions
- **Role-Based Access Control**: Three-tier system (Viewer, Analyst, Admin) enforced at middleware and service layers
- **Financial Records**: Complete CRUD operations with pagination, filtering, and search
- **Soft Delete**: Records are preserved but hidden, allowing audit trails and recovery
- **Dashboard Analytics**: Database-aggregated summary statistics, category insights, and monthly trends
- **JWT Authentication**: Secure token-based authentication with production safety checks
- **Input Validation**: Comprehensive validation and error handling on all endpoints
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Security**: Rate limiting, security headers (Helmet), password hashing (bcrypt)
- **Test Suite**: 49 integration tests covering auth, RBAC, CRUD, pagination, and edge cases

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js with TypeScript (strict mode) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | Prisma |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | express-validator |
| Testing | Jest + Supertest |
| Docs | Swagger/OpenAPI 3.0 |
| Security | Helmet, express-rate-limit, CORS |

## Quick Start

### Prerequisites
- Node.js 18 or higher
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Mishit18/finance-backend.git
cd finance-backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Generate Prisma client and run migrations
npm run prisma:generate
npm run prisma:migrate

# Seed sample data (optional)
npm run prisma:seed

# Start development server
npm run dev
```

Server runs on `http://localhost:3000`

### Run Tests

```bash
npm test                 # Run all tests
npm run test:verbose     # Run with detailed output
npm run test:coverage    # Run with coverage report
```

### API Documentation

Interactive Swagger UI available at:
```
http://localhost:3000/api-docs
```

### Sample Credentials

After seeding, use these credentials:
- **Admin**: admin@example.com / password123
- **Analyst**: analyst@example.com / password123
- **Viewer**: viewer@example.com / password123

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and receive JWT token |

### Users (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user by ID |
| PATCH | `/api/users/:id/role` | Update user role |
| PATCH | `/api/users/:id/status` | Activate/deactivate user |
| DELETE | `/api/users/:id` | Soft-delete user |

### Transactions
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/transactions` | All roles | List transactions (paginated, filterable) |
| GET | `/api/transactions/:id` | All roles | Get transaction by ID |
| POST | `/api/transactions` | Analyst, Admin | Create transaction |
| PUT | `/api/transactions/:id` | Analyst, Admin | Update transaction |
| DELETE | `/api/transactions/:id` | Admin only | Soft-delete transaction |

**Query parameters for GET /api/transactions:**
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 20, max: 100)
- `type` — Filter by INCOME or EXPENSE
- `category` — Filter by category name
- `startDate` / `endDate` — Filter by date range (ISO 8601)
- `search` — Search in description and category

### Dashboard
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/dashboard/summary` | All roles | Income/expense totals, category breakdown, trends |
| GET | `/api/dashboard/insights` | Analyst, Admin | Detailed category analytics |

### Utility
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

## Access Control Matrix

| Role | View Transactions | Create | Update | Delete | Manage Users | View Insights |
|---------|-------------------|--------|--------|--------|--------------|---------------|
| VIEWER | Own only | - | - | - | - | - |
| ANALYST | Own only | Yes | Own only | - | - | Yes |
| ADMIN | All | Yes | All | Yes | Yes | Yes |

Access control is enforced at **two levels**:
1. **Route middleware** — Role-based gate on each endpoint
2. **Service layer** — Ownership validation ensures non-admins only access their own data

## Project Structure

```
finance-backend/
├── prisma/
│   ├── migrations/         # Database migrations
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Sample data seeder
├── src/
│   ├── config/
│   │   ├── database.ts     # Prisma client singleton
│   │   └── swagger.ts      # OpenAPI configuration
│   ├── controllers/        # Request/response handlers
│   ├── middleware/
│   │   ├── auth.ts         # JWT authentication
│   │   ├── authorize.ts    # Role-based authorization
│   │   ├── errorHandler.ts # Global error handler
│   │   └── validator.ts    # Input validation
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic layer
│   ├── types/              # TypeScript type definitions
│   ├── utils/
│   │   ├── errors.ts       # Custom error classes
│   │   └── jwt.ts          # Token utilities
│   ├── app.ts              # Express app setup
│   └── server.ts           # Entry point
├── tests/
│   ├── setup.ts            # Test helpers and seeding
│   ├── auth.test.ts        # Authentication tests (12 tests)
│   ├── transactions.test.ts # Transaction CRUD tests (17 tests)
│   ├── users.test.ts       # User management tests (8 tests)
│   ├── dashboard.test.ts   # Dashboard analytics tests (8 tests)
│   └── health.test.ts      # Health and error handling tests (4 tests)
├── .env.example            # Environment template
├── Dockerfile              # Container build
├── docker-compose.yml      # Docker development setup
├── jest.config.ts          # Test configuration
├── tsconfig.json           # TypeScript configuration
├── ARCHITECTURE.md         # Detailed architecture documentation
└── ASSUMPTIONS.md          # Design decisions and assumptions
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./dev.db` |
| `JWT_SECRET` | JWT signing secret (required in production) | dev fallback |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |

## Development Commands

```bash
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript for production
npm start                # Run production build (with auto-migration)
npm test                 # Run test suite
npm run test:coverage    # Run tests with coverage report
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed sample data
npm run prisma:studio    # Open Prisma database GUI
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

## Docker Deployment

```bash
# Start with PostgreSQL
docker-compose up -d

# Or build standalone
docker build -t finance-backend .
docker run -p 3000:3000 finance-backend
```

## Database Schema

### Users
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key, auto-generated |
| email | String | Unique |
| password | String | bcrypt hashed |
| name | String | |
| role | String | VIEWER / ANALYST / ADMIN |
| status | String | ACTIVE / INACTIVE |
| deletedAt | DateTime? | Soft delete timestamp |
| createdAt | DateTime | Auto-generated |
| updatedAt | DateTime | Auto-updated |

### Transactions
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key, auto-generated |
| amount | Float | Must be positive |
| type | String | INCOME / EXPENSE |
| category | String | Free-form |
| date | DateTime | ISO 8601 |
| description | String? | Optional |
| userId | UUID | Foreign key → User (cascade delete) |
| deletedAt | DateTime? | Soft delete timestamp |
| createdAt | DateTime | Auto-generated |
| updatedAt | DateTime | Auto-updated |

**Indexes**: userId, date, category, type — optimized for filtering and dashboard queries.

## Security Features

- **Password hashing**: bcrypt with 10 salt rounds
- **JWT authentication**: 7-day expiration, production secret enforcement
- **Role-based authorization**: Middleware + service-level checks
- **Input validation**: All endpoints validated via express-validator
- **Rate limiting**: 100 requests per 15 minutes per IP
- **Security headers**: Helmet.js (CSP, HSTS, X-Frame-Options, etc.)
- **SQL injection prevention**: Prisma ORM parameterized queries (no raw SQL)
- **Soft delete**: Data preserved for audit, not permanently destroyed

## Error Handling

Consistent response format across all endpoints:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "message": "Description of the error" }
```

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Design Decisions

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation and [ASSUMPTIONS.md](ASSUMPTIONS.md) for design decisions and tradeoffs.

Key decisions:
- **SQLite for development** — Zero-setup for evaluators; schema is PostgreSQL-compatible
- **Layered architecture** — Routes → Controllers → Services → Prisma (clear separation of concerns)
- **Two-level access control** — Middleware for role gates + service-layer ownership checks
- **Soft delete** — Users and transactions are marked as deleted rather than permanently removed
- **Database aggregation** — Dashboard queries use Prisma `aggregate`/`groupBy` instead of loading all records into memory

## License

ISC
