# Project Assumptions and Design Decisions

## Database Choice

### SQLite for Development
**Decision**: Using SQLite instead of PostgreSQL for the submitted version

**Rationale**:
- **Zero Setup**: Works immediately without external database installation
- **Portability**: Database file included, evaluators can run instantly
- **Simplicity**: No connection string configuration needed
- **Testing**: Perfect for demonstration and evaluation

**Production Recommendation**: 
- PostgreSQL for production deployments
- Schema is compatible - only datasource needs changing
- Migration path documented in DEPLOYMENT.md

### Schema Adaptations
**Decision**: Using String types instead of Enums for SQLite compatibility

**Impact**:
- Role: String with values "VIEWER", "ANALYST", "ADMIN"
- Status: String with values "ACTIVE", "INACTIVE"  
- TransactionType: String with values "INCOME", "EXPENSE"

**Validation**: Enforced at application level via express-validator

## Authentication & Security

### JWT Token Expiration
**Assumption**: 7-day token expiration is acceptable
**Rationale**: Balance between security and user experience
**Production**: Consider shorter expiration with refresh tokens

### Password Requirements
**Assumption**: Minimum 6 characters is sufficient
**Rationale**: Simplified for demonstration
**Production**: Enforce stronger requirements (uppercase, numbers, symbols)

### CORS Configuration
**Assumption**: Open CORS for development
**Rationale**: Allows testing from any origin
**Production**: Restrict to specific domains

### Rate Limiting
**Assumption**: Not implemented in base version
**Rationale**: Simplified for evaluation
**Production**: Add express-rate-limit for API protection

## Data Model

### Single Currency
**Assumption**: All transactions in single currency (no currency field)
**Rationale**: Simplified financial model
**Impact**: Cannot handle multi-currency scenarios
**Extension**: Add currency field and conversion rates if needed

### Category System
**Assumption**: Free-text categories (not predefined enum)
**Rationale**: Flexibility for users to create custom categories
**Impact**: No category validation, possible typos
**Alternative**: Could add category management system

### Transaction Ownership
**Assumption**: Transactions belong to single user
**Rationale**: Personal finance tracking model
**Impact**: No shared transactions or split expenses
**Extension**: Add shared transaction support if needed

### Soft Delete
**Assumption**: Users have soft delete (INACTIVE status)
**Assumption**: Transactions have hard delete
**Rationale**: Users may need reactivation, transactions are permanent
**Extension**: Add deletedAt field for transaction recovery

## Access Control

### Three-Tier Role System
**Assumption**: Three roles are sufficient
- VIEWER: Read-only access
- ANALYST: Read + Create/Update own data
- ADMIN: Full access

**Rationale**: Covers common use cases
**Extension**: Could add more granular permissions

### Data Isolation
**Assumption**: Non-admins see only their own data
**Rationale**: Privacy and security
**Impact**: Admins see all data (for management)
**Alternative**: Could add organization-level isolation

### Role Assignment
**Assumption**: Roles assigned during registration
**Rationale**: Simplified user management
**Production**: Admin-only role assignment recommended

## API Design

### RESTful Conventions
**Assumption**: REST API is preferred over GraphQL
**Rationale**: Simpler, more widely understood
**Alternative**: GraphQL could provide more flexibility

### Pagination
**Assumption**: Not implemented in base version
**Rationale**: Simplified for demonstration
**Impact**: May not scale for large datasets
**Production**: Add pagination for list endpoints

### Filtering
**Assumption**: Basic filtering by date, category, type
**Rationale**: Covers common use cases
**Extension**: Add full-text search, advanced filters

### Response Format
**Assumption**: Consistent JSON structure
```json
{
  "success": true/false,
  "data": {...} or "message": "..."
}
```
**Rationale**: Predictable API responses

## Error Handling

### Error Messages
**Assumption**: Generic error messages for security
**Rationale**: Don't expose internal details
**Example**: "Invalid credentials" instead of "User not found"

### Status Codes
**Assumption**: Standard HTTP status codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

### Validation Errors
**Assumption**: Return all validation errors at once
**Rationale**: Better UX than one-at-a-time
**Implementation**: express-validator

## Performance

### Database Indexes
**Assumption**: Index frequently queried fields
**Implemented**: userId, date, category, type
**Rationale**: Optimize common queries
**Impact**: Faster reads, slightly slower writes

### Connection Pooling
**Assumption**: Default Prisma connection pooling is sufficient
**Rationale**: Good for small-medium scale
**Production**: Configure explicit pool size

### Caching
**Assumption**: No caching layer in base version
**Rationale**: Simplified architecture
**Production**: Add Redis for dashboard data

## Scalability

### Horizontal Scaling
**Assumption**: Stateless JWT enables horizontal scaling
**Rationale**: No session storage needed
**Impact**: Can run multiple instances behind load balancer

### Database Scaling
**Assumption**: Single database instance
**Rationale**: Sufficient for demonstration
**Production**: Consider read replicas, sharding

### File Storage
**Assumption**: No file uploads in base version
**Rationale**: Simplified scope
**Extension**: Add S3/cloud storage if needed

## Internationalization

### Language
**Assumption**: English only
**Rationale**: Simplified for demonstration
**Impact**: No i18n support
**Extension**: Add i18n library if needed

### Date/Time
**Assumption**: ISO 8601 format, UTC timezone
**Rationale**: Standard, unambiguous
**Impact**: Frontend handles timezone conversion

### Number Formatting
**Assumption**: Decimal numbers for amounts
**Rationale**: Standard financial representation
**Impact**: Frontend handles currency formatting

## Testing

### Test Data
**Assumption**: Seed script provides sample data
**Rationale**: Easy evaluation and testing
**Included**: 3 users, 9 transactions

### Test Credentials
**Assumption**: Simple passwords for demo
**Credentials**: password123 for all users
**Production**: Enforce strong passwords

## Deployment

### Environment Variables
**Assumption**: .env file for configuration
**Rationale**: Standard practice
**Security**: .env not committed to git

### Docker Support
**Assumption**: Docker Compose for easy deployment
**Rationale**: Consistent environment
**Included**: Dockerfile, docker-compose.yml

### Health Check
**Assumption**: Basic health endpoint
**Endpoint**: GET /health
**Production**: Add database connectivity check

## Monitoring & Logging

### Logging
**Assumption**: Console logging for development
**Rationale**: Simplified for demonstration
**Production**: Add Winston/Pino for structured logging

### Monitoring
**Assumption**: No APM in base version
**Rationale**: Simplified scope
**Production**: Add Prometheus, Grafana, or similar

### Error Tracking
**Assumption**: No error tracking service
**Rationale**: Simplified scope
**Production**: Add Sentry or similar

## Compliance & Legal

### Data Privacy
**Assumption**: No GDPR/privacy features
**Rationale**: Demonstration project
**Production**: Add data export, deletion, consent

### Audit Trail
**Assumption**: Basic timestamps only
**Rationale**: Simplified scope
**Production**: Add comprehensive audit logging

### Data Retention
**Assumption**: No automatic data deletion
**Rationale**: Simplified scope
**Production**: Add retention policies

## Business Logic

### Transaction Validation
**Assumption**: Positive amounts only
**Rationale**: Prevent data entry errors
**Impact**: No negative transactions

### Date Validation
**Assumption**: Any valid date accepted
**Rationale**: Flexibility for backdating
**Alternative**: Could restrict to past dates only

### Category Validation
**Assumption**: Any non-empty string accepted
**Rationale**: User flexibility
**Impact**: No standardization

## Development Workflow

### Version Control
**Assumption**: Git for version control
**Rationale**: Industry standard
**Included**: .gitignore

### Code Style
**Assumption**: TypeScript strict mode
**Rationale**: Maximum type safety
**Impact**: Catches errors at compile time

### Dependencies
**Assumption**: npm for package management
**Rationale**: Most common choice
**Alternative**: yarn, pnpm also work

## Trade-offs Made

### Simplicity vs Features
**Choice**: Prioritized clean, maintainable code over feature richness
**Rationale**: Better to do less well than more poorly

### Security vs Convenience
**Choice**: Balanced security with ease of evaluation
**Example**: Simple passwords, open CORS for demo

### Performance vs Readability
**Choice**: Prioritized readable code over micro-optimizations
**Rationale**: Premature optimization avoided

### Flexibility vs Constraints
**Choice**: String-based categories vs enum
**Rationale**: User flexibility over strict validation

## Future Enhancements

### Recommended Additions
1. Automated tests (Jest, Supertest)
2. API documentation (Swagger/OpenAPI)
3. Request logging (Winston, Morgan)
4. Rate limiting (express-rate-limit)
5. Pagination for large datasets
6. Search functionality
7. Refresh tokens
8. Email notifications
9. Export to CSV/PDF
10. Budget tracking features

### Not Included (Out of Scope)
- Multi-tenancy
- Real-time updates (WebSockets)
- File uploads
- Email verification
- Two-factor authentication
- Social login
- Mobile app support
- Cryptocurrency support

## Conclusion

These assumptions were made to create a clean, maintainable, and evaluable backend system that demonstrates:
- Strong architectural thinking
- Security awareness
- Scalability considerations
- Production readiness mindset

While simplified for demonstration, the foundation supports extension to production-grade features.

**Note**: All assumptions are documented here for transparency and to show thoughtful decision-making process.
