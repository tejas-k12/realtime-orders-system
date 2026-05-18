# Real-Time Order Dashboard

A real-time order tracking dashboard built with **PostgreSQL LISTEN/NOTIFY**, **Node.js**, and **Socket.IO**. Updates are pushed instantly to all connected clients whenever an order is inserted, updated, or deleted so no polling required.

---

## Approach

This system uses an **event-driven architecture** to deliver real-time updates to connected clients.

Instead of polling (where clients repeatedly request updates), the solution leverages PostgreSQL's native `LISTEN/NOTIFY` mechanism paired with WebSockets via Socket.IO.

### How It Works

1. A trigger is attached to the `orders` table.
2. On every `INSERT`, `UPDATE`, or `DELETE`:
   - PostgreSQL fires `pg_notify()` with a JSON payload.
   - The Node.js backend, listening via `LISTEN order_changes;`, receives the event.
   - The backend broadcasts the update to all connected clients using Socket.IO.
3. The frontend dashboard receives the update **instantly** and re-renders without a page refresh.

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Database | PostgreSQL `LISTEN/NOTIFY` | Built-in real-time notifications so no extra message broker needed |
| Backend | Node.js + Socket.IO | Persistent WebSocket connections for low-latency push |
| Frontend | HTML + CSS + JavaScript | Lightweight browser dashboard; easy to verify live updates |

---

## Prerequisites

Make sure the following are installed before proceeding:

### Node.js (v18+ recommended)

- **Download:** https://nodejs.org/en/download
- **Verify installation:**
```bash
  node -v
  npm -v
```

### PostgreSQL (v14+ recommended)

- **Windows:** https://www.postgresql.org/download/windows/
- **macOS:** https://www.postgresql.org/download/macos/ (or via Homebrew: `brew install postgresql`)
- **Linux (Ubuntu/Debian):**
```bash
  sudo apt update
  sudo apt install postgresql postgresql-contrib
```
- **Verify installation:**
```bash
  psql --version
```
- **Start the PostgreSQL service:**
```bash
  # macOS (Homebrew)
  brew services start postgresql

  # Linux
  sudo systemctl start postgresql
  sudo systemctl enable postgresql

  # Windows
  # PostgreSQL runs as a service automatically after installation
```

### Git (optional, for cloning)

- **Download:** https://git-scm.com/downloads

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Install Node Dependencies

```bash
npm install express socket.io pg cors
npm install -D nodemon
```

---

## Database Setup

### 3. Create the Database

Open a PostgreSQL shell:

```bash
psql -U postgres
```

Then run:

```sql
CREATE DATABASE realtime_orders;
\c realtime_orders;
```

### 4. Create the `orders` Table

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100),
    product_name VARCHAR(100),
    status VARCHAR(20),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Create the Trigger Function

```sql
CREATE OR REPLACE FUNCTION notify_order_change()
RETURNS TRIGGER AS $$
DECLARE
    payload JSON;
BEGIN
    IF TG_OP = 'DELETE' THEN
        payload = json_build_object(
            'operation', TG_OP,
            'data', row_to_json(OLD)
        );
    ELSE
        payload = json_build_object(
            'operation', TG_OP,
            'data', row_to_json(NEW)
        );
    END IF;

    PERFORM pg_notify('order_changes', payload::text);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### 6. Create the Trigger

```sql
CREATE TRIGGER order_change_trigger
AFTER INSERT OR UPDATE OR DELETE
ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_change();
```

---

## Running the App

### 7. Configure Database Connection

Make sure your backend's database config matches your local PostgreSQL credentials. Typically in a `db.js` or `server.js` file:

```js
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'realtime_orders',
  user: 'postgres',       // your PostgreSQL username
  password: 'yourpassword' // your PostgreSQL password
});
```

### 8. Start the Backend Server

```bash
npm run dev
```

### 9. Open the Dashboard

Open your browser and navigate to:
http://localhost:5000

You should see the live dashboard. To test it, open a new terminal, connect to the database, and insert a row:

```bash
psql -U postgres -d realtime_orders
```

```sql
INSERT INTO orders (customer_name, product_name, status)
VALUES ('Alice', 'Laptop', 'pending');
```

The dashboard will update in real time without any page refresh.

---

## Project Structure
├── server.js, db.js          # Node.js backend (Express + Socket.IO + pg)
├── public/
│   └── index.html, styles.css, script.js     # Frontend dashboard
├── package.json
└── README.md

> Adjust paths above to match your actual project structure.

---

## Design Decisions

**Why PostgreSQL `LISTEN/NOTIFY`?**
PostgreSQL ships with built-in pub/sub support through `LISTEN` and `NOTIFY`. This eliminates the need for a separate message broker (e.g., Redis, Kafka) for lightweight real-time use cases.

**Why Socket.IO?**
Socket.IO provides a persistent, bidirectional WebSocket channel between the server and clients, with automatic fallbacks for older environments.

**Why a browser-based frontend?**
A browser dashboard gives an immediate, visual way to confirm that updates arrive in real time — no tooling required beyond opening a tab.
