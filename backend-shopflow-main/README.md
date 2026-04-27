# ShopFlow Backend

Spring Boot 3 backend for the ShopFlow marketplace project.

## Tech Stack

- Java 21
- Spring Boot 3.3.x
- Spring Security 6 + JWT (access + refresh)
- Spring Data JPA + Specifications
- H2 (dev) / PostgreSQL (prod)
- OpenAPI (Springdoc)

## Run

### 1) Prerequisites

- JDK 21
- Maven 3.9+

### 2) Start in dev profile (H2)

```bash
mvn spring-boot:run
```

Default port: `9090`

### 3) API docs

- Swagger UI: `http://localhost:9090/swagger-ui`
- OpenAPI JSON: `http://localhost:9090/v3/api-docs`

## Profiles

- `dev`: H2 in-memory DB (`application-dev.properties`)
- `prod`: PostgreSQL (`application-prod.properties`)

Active profile is controlled in `application.properties`:

```properties
spring.profiles.active=dev
```

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Refresh tokens are stored in DB and can be revoked on refresh/logout.

## Required Modules

- Products: soft delete, promo price, categories (many-to-many), variants, full-text search
- Categories: tree structure (parent/children)
- Cart: persistent cart, variant-aware stock checks, coupon support
- Orders: address-based checkout, lifecycle transitions, cancellation rules, simulated refund
- Reviews: purchase verification and moderation
- Dashboard: admin and seller stats

## Tests

```bash
mvn test
```
