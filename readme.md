# Real-Time Orders Update System

## Documentation

---

## Approach Used

The system was designed using an event-driven architecture to provide real-time updates to connected clients whenever changes occur in the database.

Instead of using polling (where clients repeatedly request updates from the server), the solution uses PostgreSQL’s native LISTEN/NOTIFY mechanism along with WebSockets through Socket.IO.

---

## Working

A trigger is attached to the `orders` table.

Whenever an insert, update, or delete operation occurs:
- PostgreSQL automatically generates a notification using `pg_notify()`

The Node.js backend continuously listens for these notifications using:

```sql
listen order_changes;

Once the backend receives the event:

it broadcasts the update to all connected clients using Socket.IO

The frontend dashboard receives the update instantly and updates the UI in real time without requiring a page refresh.

The frontend client is implemented using HTML, CSS, and JavaScript and acts as a lightweight browser-based dashboard.

How to Run the Solution
1. Install Dependencies
npm install express socket.io pg cors

Install development dependency:

npm install -D nodemon
2. Start PostgreSQL

Ensure PostgreSQL is installed and running.

Create database:

create database realtime_orders;

Connect to database:

\c realtime_orders;
3. Create Orders Table
create table orders (
    id serial primary key,
    customer_name varchar(100),
    product_name varchar(100),
    status varchar(20),
    updated_at timestamp default current_timestamp
);
4. Create Trigger Function
create or replace function notify_order_change()
returns trigger as $$
declare
    payload json;
begin
    if tg_op = 'delete' then
        payload = json_build_object(
            'operation', tg_op,
            'data', row_to_json(old)
        );
    else
        payload = json_build_object(
            'operation', tg_op,
            'data', row_to_json(new)
        );
    end if;

    perform pg_notify('order_changes', payload::text);

    return null;
end;
$$ language plpgsql;
5. Create Trigger
create trigger order_change_trigger
after insert or update or delete
on orders
for each row
execute function notify_order_change();
6. Start Backend Server
npm run dev
7. Open Frontend

Open browser:

http://localhost:5000
Why PostgreSQL LISTEN/NOTIFY?

PostgreSQL provides built-in support for real-time notifications through:

LISTEN
NOTIFY

This makes it suitable for lightweight real-time systems without requiring additional message brokers.

Why Socket.IO?

Socket.IO provides persistent WebSocket communication between the backend and connected clients.

Benefits:

real-time bidirectional communication
automatic reconnection
event-based architecture
Why Browser-Based Frontend?

A browser dashboard provides a simple and visual way to demonstrate real-time updates.

It allows evaluators to verify instantly that updates are being pushed without refreshing the page.
