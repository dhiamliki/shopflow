# ShopFlow Backend

Spring Boot 3 backend for the ShopFlow marketplace project.

## Tech Stack

- Java 21
- Spring Boot 3.3.x
- Spring Security 6 + JWT (access + refresh)
- Spring Data JPA + Specifications
- PostgreSQL (dev/prod), with H2 retained only as a test/runtime dependency
- OpenAPI (Springdoc)

## Run

### 1) Prerequisites

- JDK 21
- Maven 3.9+

### 2) Start in dev profile (PostgreSQL)

Create a local PostgreSQL database first, or override the connection with environment variables.

Default connection:

- URL: `jdbc:postgresql://localhost:5432/shopflow`
- Username: `shopflow`
- Password: `shopflow`

```bash
mvn spring-boot:run
```

Default port: `9090`

### 3) API docs

- Swagger UI: `http://localhost:9090/swagger-ui`
- OpenAPI JSON: `http://localhost:9090/v3/api-docs`

## Profiles

- `dev`: PostgreSQL (`application-dev.properties`)
- `prod`: PostgreSQL (`application-prod.properties`)

Active profile is controlled in `application.properties`:

```properties
spring.profiles.active=${SPRING_PROFILES_ACTIVE:dev}
```

The marketplace seeder runs for `dev` and `prod` profiles. It upserts seller accounts,
seller profiles, category trees, products, variants, images, reviews, orders, carts, and
coupons, and it skips completed seeds so repeated startup does not duplicate listings.

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
