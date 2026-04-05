# Architecture & Design Decisions

## System Architecture

### High-Level Overview

```
┌─────────────┐
│   Client    │
│ (Frontend)  │
└──────┬──────┘
       │ HTTP/REST
       │
┌──────▼──────────────────────────────────────┐
│           Express.js Server                 │
│                                              │
│  ┌────────────────────────────────────┐    │
│  │         Middleware Layer           │    │
│  │  • CORS                            │    │
│  │  • Body Parser                     │    │
│  │  • Authentication (JWT)            │    │
│  │  • Authorization (RBAC)            │    │
│  │  • Validation                      │    │
│  │  • Error Handler                   │    │
│  └────────────┬───────────────────────┘    │
│               │                              │
│  ┌────────────▼───────────────────────┐    │
│  │         Routes Layer               │    │
│  │  • /api/auth                       │    │
│  │  • /api/users                      │    │
│  │  • /api/transactions               │    │
│  │  • /api/dashboard                  │    │
│  └────────────┬───────────────────────┘    │
│               │                              │
│  ┌────────────▼───────────────────────┐    │
│  │      Controllers Layer             │    │
│  │  • Request handling                │    │
│  │  • Response formatting             │    │
│  │  • Error propagation               │    │
│  └────────────┬───────────────────────┘    │
│               │                              │
│  ┌────────────▼───────────────────────┐    │
│  │       Services Layer               │    │
│  │  • Business logic                  │    │
│  │  • Data validation                 │    │
│  │  • Access control logic            │    │
│  │  • Aggregations & calculations     │    │
│  └────────────┬───────────────────────┘    │
│               │                              │
│  ┌────────────▼───────────────────────┐    │
│  │      Prisma ORM Layer              │    │
│  │  • Query building                  │    │
│  │  • Type safety                     │    │
│  │  • Migrations                      │    │
│  └────────────┬───────────────────────┘    │
└───────────────┼──────────────────────────────┘
                │
       ┌────────▼────────┐
       │   PostgreSQL    │
       │    Database     │
       └─────────────────┘
```

## Layer Responsibilities

### 1. Routes Layer
- Define API endpoints
- Apply middleware (auth, validation)
- Route requests to controllers
- Input validation using express-validator

### 2. Controllers Layer
- Handle HTTP requests/responses
- Extract data from requests
- Call appropriate services
- Format responses
- Catch and forward errors

### 3. Services Layer
- Implement business logic
- Enforce access control rules
- Perform data transformations
- Handle complex operations
- Interact with database via Prisma

### 4. Middleware Layer
- Authentication (JWT verification)
- Authorization (role-based checks)
- Request validation
- Error handling
- CORS configuration

### 5. Database Layer
- Data persistence
- Relationships management
- Query optimization via indexes
- Transaction support

## Design Patterns

### 1. Layered Architecture
- Clear separation of concerns
- Each layer has specific responsibility
- Dependencies flow downward
- Easy to test and maintain

### 2. Dependency Injection
- Services instantiated in controllers
- Loose coupling between components
- Easy to mock for testing

### 3. Repository Pattern (via Prisma)
- Abstract database operations
- Type-safe queries
- Centralized data access

### 4. Middleware Pattern
- Cross-cutting concerns (auth, logging)
- Reusable across routes
- Chain of responsibility

### 5. Error Handling Pattern
- Custom error classes
- Centralized error handler
- Consistent error responses

## Access Control Design

### Role-Based Access Control (RBAC)

```typescript
enum Role {
  VIEWER   // Read-only access
  ANALYST  // Read + Create/Update own data
  ADMIN    // Full access
}
```

### Permission Matrix

| Resource      | Operation | Viewer | Analyst | Admin |
|---------------|-----------|--------|---------|-------|
| Transactions  | Read Own  | ✅     | ✅      | ✅    |
| Transactions  | Read All  | ❌     | ❌      | ✅    |
| Transactions  | Create    | ❌     | ✅      | ✅    |
| Transactions  | Update Own| ❌     | ✅      | ✅    |
| Transactions  | Update All| ❌     | ❌      | ✅    |
| Transactions  | Delete    | ❌     | ❌      | ✅    |
| Dashboard     | Summary   | ✅     | ✅      | ✅    |
| Dashboard     | Insights  | ❌     | ✅      | ✅    |
| Users         | Read      | ❌     | ❌      | ✅    |
| Users         | Manage    | ❌     | ❌      | ✅    |

### Implementation Strategy

1. **Authentication Middleware**: Verifies JWT token
2. **Authorization Middleware**: Checks user role
3. **Service-Level Checks**: Validates ownership for non-admins

```typescript
// Route level - role check
router.get('/', authorize(Role.VIEWER, Role.ANALYST, Role.ADMIN), handler);

// Service level - ownership check
if (userRole !== 'ADMIN' && transaction.userId !== userId) {
  throw new ForbiddenError();
}
```

## Data Model Design

### User Entity
```prisma
model User {
  id           String        @id @default(uuid())
  email        String        @unique
  password     String        // Hashed with bcrypt
  name         String
  role         Role          @default(VIEWER)
  status       UserStatus    @default(ACTIVE)
  transactions Transaction[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}
```

**Design Decisions:**
- UUID for IDs (better for distributed systems)
- Email as unique identifier
- Soft delete via status field
- Timestamps for audit trail

### Transaction Entity
```prisma
model Transaction {
  id          String          @id @default(uuid())
  amount      Float
  type        TransactionType
  category    String
  date        DateTime
  description String?
  userId      String
  user        User            @relation(fields: [userId], references: [id])
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}
```

**Design Decisions:**
- Flexible category (string vs enum) for extensibility
- Optional description field
- Indexed fields for query performance
- Cascade delete with user

### Indexes
```prisma
@@index([userId])    // Fast user-specific queries
@@index([date])      // Date range filtering
@@index([category])  // Category filtering
@@index([type])      // Type filtering
```

## Security Considerations

### 1. Authentication
- JWT tokens with 7-day expiration
- Secure password hashing (bcrypt, 10 rounds)
- Token verification on protected routes

### 2. Authorization
- Role-based access control
- Ownership validation for non-admins
- Active user status check

### 3. Input Validation
- express-validator for all inputs
- Type checking via TypeScript
- Prisma schema validation

### 4. SQL Injection Prevention
- Prisma ORM parameterized queries
- No raw SQL queries

### 5. Error Handling
- No sensitive data in error messages
- Generic 500 errors for unexpected issues
- Detailed logging server-side only

## API Design Principles

### 1. RESTful Conventions
```
GET    /api/transactions      # List
POST   /api/transactions      # Create
GET    /api/transactions/:id  # Read
PUT    /api/transactions/:id  # Update
DELETE /api/transactions/:id  # Delete
```

### 2. Consistent Response Format
```json
{
  "success": true,
  "data": { ... }
}
```

```json
{
  "success": false,
  "message": "Error description"
}
```

### 3. HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

### 4. Query Parameters for Filtering
```
GET /api/transactions?startDate=2024-01-01&category=Salary&type=INCOME
```

## Performance Optimizations

### 1. Database Indexes
- Indexed frequently queried fields
- Composite indexes for common queries

### 2. Efficient Queries
- Select only needed fields
- Avoid N+1 queries via Prisma includes
- Pagination ready (not implemented but easy to add)

### 3. Connection Pooling
- Prisma manages connection pool
- Configurable pool size

## Scalability Considerations

### Current Architecture Supports:
1. **Horizontal Scaling**: Stateless JWT auth
2. **Database Scaling**: PostgreSQL replication
3. **Caching Layer**: Redis can be added
4. **Load Balancing**: Multiple app instances

### Future Enhancements:
1. **Pagination**: For large datasets
2. **Rate Limiting**: Prevent abuse
3. **Caching**: Redis for dashboard data
4. **Message Queue**: For async operations
5. **Microservices**: Split by domain

## Testing Strategy

### Unit Tests (Recommended)
- Service layer logic
- Utility functions
- Middleware functions

### Integration Tests (Recommended)
- API endpoints
- Database operations
- Authentication flow

### E2E Tests (Optional)
- Complete user flows
- Access control scenarios

## Deployment Architecture

### Development
```
Local Machine → PostgreSQL (local) → Express Server (local)
```

### Production (Recommended)
```
Load Balancer → App Instances (N) → PostgreSQL (managed)
                                  → Redis (cache)
```

### Docker Deployment
```bash
docker-compose up
```
- Isolated environment
- Easy setup
- Production-ready

## Monitoring & Logging

### Recommended Additions:
1. **Logging**: Winston or Pino
2. **Monitoring**: Prometheus + Grafana
3. **Error Tracking**: Sentry
4. **APM**: New Relic or DataDog

## Trade-offs & Assumptions

### Trade-offs Made:
1. **Simplicity over Features**: Basic CRUD vs complex workflows
2. **Monolith over Microservices**: Easier to develop and deploy
3. **JWT over Sessions**: Stateless but can't revoke easily
4. **String Categories**: Flexible but less type-safe

### Assumptions:
1. Single currency (no multi-currency)
2. Single tenant (no multi-tenancy)
3. Basic analytics (no complex BI)
4. English only (no i18n)
5. Small to medium dataset (no sharding)

## Code Quality Practices

### 1. TypeScript
- Full type safety
- Compile-time error detection
- Better IDE support

### 2. Consistent Naming
- camelCase for variables/functions
- PascalCase for classes/types
- UPPER_CASE for constants

### 3. Error Handling
- Custom error classes
- Try-catch in async functions
- Centralized error handler

### 4. Code Organization
- Feature-based structure
- Single responsibility principle
- DRY (Don't Repeat Yourself)

## Extensibility Points

### Easy to Add:
1. **New Roles**: Add to enum and update middleware
2. **New Endpoints**: Follow existing pattern
3. **New Validations**: Add to route validators
4. **New Business Logic**: Add to services

### Requires More Work:
1. **Multi-tenancy**: Add organization model
2. **Real-time Updates**: Add WebSocket support
3. **File Uploads**: Add storage service
4. **Email Notifications**: Add email service

## Conclusion

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Type safety throughout
- ✅ Robust access control
- ✅ Scalable foundation
- ✅ Maintainable codebase
- ✅ Production-ready structure

The design prioritizes clarity, correctness, and maintainability while remaining flexible for future enhancements.
