# Palmyra House: Hotel Reservation Management System

A full-stack hotel booking system: guests search for rooms, book and pay, and manage their stays; hotel staff run the
day-to-day from an admin panel.

> **Palmyra House is a fictional hotel** created for coursework. The address, phone number, email and house rules in
> `frontend/src/config/site.js` are placeholders. Card payments are a **demonstration**: nothing is charged and no real
> card should be entered.

| | |
|---|---|
| **Backend** | Java 21, Spring Boot 3 (Web, Data JPA, Validation, Security), Maven |
| **Database** | PostgreSQL 17 with Flyway migrations |
| **Frontend** | React 18 (Vite), React Router, hand-written CSS (no UI kit) |
| **Architecture** | MVC, layered: controller, service, repository, model |
| **Currency** | Sri Lankan rupees (LKR) |

## Features

**Guests**
- Search rooms by dates, guests and type, with live availability and the total price for the stay
- Room pages with photos, amenities and real reviews
- Register and log in; book and pay by card (demo) or choose to pay at the front desk
- Booking confirmation with a reference (for example `PH00016`); My bookings with Upcoming, Past and Cancelled
- Cancel free until the day before arrival (card payments are refunded); review a room after the stay
- Account page with change password

**Staff and administrators** (`/admin`)
- Overview: arrivals, departures, rooms in house, bookings awaiting payment, money collected
- Reservations: search and filter, record a cash payment, cancel
- Rooms: close for maintenance or reopen; **administrators** can also change prices
- Staff accounts (administrators only): create accounts, change roles

## Quick start

**You need:** Java 21, Maven, Node 20+, and PostgreSQL running locally.

```bash
./scripts/setup-local.sh   # once: creates the database and user, and writes backend/.env with generated secrets
./dev.sh                   # starts the backend (port 8080) and the website (port 5173); Ctrl+C stops both
```

Then open **http://localhost:5173**. The setup script prints the first administrator's login (user `admin`).
Run the pieces separately with `./run-backend.sh` and `./run-frontend.sh` if you prefer two terminals.

<details>
<summary>Setting up without the script</summary>

```bash
psql -d postgres -c "CREATE USER hotel_user WITH PASSWORD 'choose-a-password';"
psql -d postgres -c "CREATE DATABASE hotel_db OWNER hotel_user;"
psql -d postgres -c "CREATE DATABASE hotel_test OWNER hotel_user;"
cp backend/.env.example backend/.env      # then edit it: password, a 32+ character JWT_SECRET, admin login
```
The tables, three sample rooms and their LKR rates are created automatically on first start (Flyway).
</details>

## Running the tests

```bash
cd backend && set -a && . ./.env && set +a && mvn test     # 63 tests, uses the separate hotel_test database
cd frontend && npm test                                     # 44 tests
cd frontend && npm run build                                # production build
```

Backend tests run the real application (security, controllers, services, PostgreSQL) and roll back after each test,
so your `hotel_db` data is never touched.

## Who can do what

| | Guest | Staff | Administrator |
|---|:-:|:-:|:-:|
| Browse rooms, read reviews | yes | yes | yes |
| Book, pay, cancel and review their own stays | yes | yes | yes |
| See all reservations, record cash, cancel any booking | | yes | yes |
| Close or reopen rooms | | yes | yes |
| Change room prices | | | yes |
| Create staff accounts, change roles | | | yes |

Guests register themselves. Staff and administrator accounts are created by an administrator, and the first administrator
comes from `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `backend/.env`.

## How it is built

### MVC and layers
```
React pages (View)  ->  REST controllers  ->  services (business rules)  ->  repositories  ->  PostgreSQL
                         (Controller)                                       (Spring Data JPA)   (Model = entities)
```
- `backend/src/main/java/com/hotel/management/`
  - `controller/` takes requests and returns DTOs; no business logic
  - `service/` holds the rules: availability, pricing, cancellation, payments, reviews, access
  - `repository/` data access
  - `model/` entities and enums (the domain)
  - `dto/`, `mapper/` the API's request and response shapes, kept separate from the database model
  - `security/` JWT login, role checks, login lockout
  - `exception/` one handler turns every error into the same JSON shape
- `frontend/src/`: `pages/`, `components/`, `api/` (one module per backend area), `lib/` (plain, tested logic), `styles/`

### Object-oriented design
| Concept | Where |
|---|---|
| **Inheritance** | `Person` (abstract) is extended by `Guest`; `Payment` (abstract) is extended by `CardPayment` and `CashPayment` |
| **Polymorphism** | Each payment type implements `describe()` and `getMethod()` its own way; `Person.getDisplayName()` is abstract |
| **Encapsulation** | Entities guard their own rules: `Reservation` validates dates and works out its price in its constructor, and `cancel()`, `Room.canHost()` and `Payment.refund()` enforce state changes |
| **Abstraction** | Controllers depend on services, services on repository interfaces; DTOs hide the persistence model |
| **Enums** | `Role`, `RoomStatus`, `ReservationStatus`, `PaymentStatus`, `PaymentMethod` |

### Database
Managed by Flyway migrations in `backend/src/main/resources/db/migration/` (V1 to V4). Main tables: `app_user`, `guest`,
`room_type`, `room`, `reservation`, `payment` (single table, card and cash subclasses), `review`.
Hibernate only validates the schema; it never changes it.

### REST API (JSON, under `/api`)
| | |
|---|---|
| `POST /auth/register`, `/auth/login` | public; returns a token and the user |
| `GET /auth/me`, `POST /auth/change-password` | logged in |
| `GET /rooms`, `/rooms/{id}`, `/rooms/available`, `/rooms/{id}/reviews` | public |
| `POST /reservations`, `GET /reservations/mine`, `GET`/`DELETE /reservations/{id}` | logged in (own bookings) |
| `POST /payments`, `GET /reservations/{id}/payments`, `POST /reviews` | logged in (own bookings; cash is staff-only) |
| `GET /reservations` | staff and administrators |
| `GET /admin/summary`, `PATCH /admin/rooms/{id}` | staff and administrators (price changes: administrators) |
| `GET`/`POST /admin/users`, `PATCH /admin/users/{id}` | administrators |

Errors always look like `{ "status": 409, "error": "message", "fieldErrors": { } }`.

### Security
- Passwords are stored as BCrypt hashes; requests are validated on the server as well as in the browser
- Login uses signed tokens, but a user's **role is read from the database on every request**, so a demoted or deleted
  user loses access immediately
- Guests can only see and change their own bookings (someone else's booking looks like it does not exist)
- Five wrong passwords lock an account for 15 minutes (an address is limited too)
- Card numbers are never stored: only the brand and last 4 digits; the expiry date and security code never leave the browser
- CORS allows only the website's own origin; secrets live in `backend/.env`, which is git-ignored

## Design notes
Warm, natural look inspired by boutique hotel sites: Fraunces for the page titles and logo, Figtree for everything else,
a sand, palm-green and clay palette. Layouts work from 360 px phones up. The site is keyboard-friendly and passes an automated
accessibility audit (axe) on every page. Photos need alternative text and fall back to a neutral frame if missing.

## Known limits
- Payments are simulated; there is no real card gateway
- The login lockout is held in memory, so it resets when the server restarts
- One hotel, one currency, one language
- Room photos are shared per room type (`frontend/IMAGES.md` lists the files)

## Photo credits
The photographs in `frontend/public/images/` are stand-ins used while building. **Replace them with images you have the
right to use, and list their sources here before publishing.**

| File | Source |
|---|---|
| _to be added_ | |

## Branches
`main` is the stable branch; work happens on `development` and is merged by pull request.
