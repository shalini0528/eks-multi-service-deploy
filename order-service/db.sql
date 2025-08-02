CREATE DATABASE IF NOT EXISTS lugxdbOrder;

USE lugxdbOrder;

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled', 'refunded') DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    game_id INT NOT NULL,
    game_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price_per_item DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);


INSERT INTO customers (name, email) VALUES 
('Alice Smith', 'alice@example.com'),
('Bob Johnson', 'bob@example.com'),
('Charlie Davis', 'charlie@example.com');

INSERT INTO orders (customer_id, total_price, status) VALUES 
(1, 59.98, 'completed'),
(2, 39.99, 'processing'),
(3, 99.99, 'pending');

INSERT INTO cart_items (order_id, game_id, game_name, quantity, price_per_item, subtotal) VALUES 
(1, 101, 'The Witcher 3', 1, 39.99, 39.99),
(1, 102, 'Minecraft', 1, 19.99, 19.99),

(2, 103, 'Cyberpunk 2077', 1, 39.99, 39.99),

(3, 104, 'Red Dead Redemption 2', 1, 59.99, 59.99),
(3, 105, 'Stardew Valley', 2, 20.00, 40.00);
