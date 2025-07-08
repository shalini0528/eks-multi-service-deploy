CREATE DATABASE IF NOT EXISTS lugxdb;

USE lugxdb;

CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    release_date DATE,
    price DECIMAL(10, 2)
);


-- Insert sample games
INSERT INTO games (name, category, release_date, price) VALUES
('Elder Scrolls V: Skyrim', 'RPG', '2011-11-11', 39.99),
('Counter-Strike: Global Offensive', 'Shooter', '2012-08-21', 0.00),
('Minecraft', 'Sandbox', '2011-11-18', 26.95),
('The Witcher 3: Wild Hunt', 'RPG', '2015-05-19', 29.99),
('Fortnite', 'Battle Royale', '2017-07-21', 0.00);