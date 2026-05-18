const socket = io('http://localhost:5000');

const updatesDiv = document.getElementById('updates');

function createCard(order, operation = 'EXISTING ORDER') {

    const card = document.createElement('div');

    card.classList.add('card');

    card.innerHTML = `
        <h3>${operation}</h3>
        <p><strong>ID:</strong> ${order.id}</p>
        <p><strong>Customer:</strong> ${order.customer_name}</p>
        <p><strong>Product:</strong> ${order.product_name}</p>
        <p><strong>Status:</strong> ${order.status}</p>
    `;

    updatesDiv.prepend(card);
}

async function loadOrders() {

    try {

        const response = await fetch('/orders');

        const orders = await response.json();

        updatesDiv.innerHTML = '';

        orders.forEach(order => {
            createCard(order);
        });

    }
    catch (err) {
        console.log('Error loading orders:', err);
    }
}

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('order_update', (payload) => {

    console.log('Realtime update:', payload);

    createCard(payload.data, payload.operation);
});

loadOrders();