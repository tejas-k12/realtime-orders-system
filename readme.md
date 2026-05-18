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

## Getting Started

### 1. Install Dependencies

```bash
npm install express socket.io pg cors
npm install -D nodemon
```

### 2. Set Up PostgreSQL

Ensure PostgreSQL is installed and running, then create and connect to the database:

```sql
CREATE DATABASE realtime_orders;
\c realtime_orders;
```

### 3. Create the `orders` Table

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100),
    product_name VARCHAR(100),
    status VARCHAR(20),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Create the Trigger Function

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

### 5. Create the Trigger

```sql
CREATE TRIGGER order_change_trigger
AFTER INSERT OR UPDATE OR DELETE
ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_change();
```

### 6. Start the Backend

```bash
npm run dev
```

### 7. Open the Dashboard

Navigate to:
http://localhost:5000
---

## Design Decisions

**Why PostgreSQL `LISTEN/NOTIFY`?**
PostgreSQL ships with built-in pub/sub support through `LISTEN` and `NOTIFY`. This eliminates the need for a separate message broker (e.g., Redis, Kafka) for lightweight real-time use cases.

**Why Socket.IO?**
Socket.IO provides a persistent, bidirectional WebSocket channel between the server and clients, with automatic fallbacks for older environments.

**Why a browser-based frontend?**
A browser dashboard gives an immediate, visual way to confirm that updates arrive in real time — no tooling required beyond opening a tab.
