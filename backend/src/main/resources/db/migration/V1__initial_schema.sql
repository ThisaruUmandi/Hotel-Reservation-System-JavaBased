CREATE TABLE room (
    id             BIGSERIAL PRIMARY KEY,
    room_number    VARCHAR(255) NOT NULL UNIQUE,
    type           VARCHAR(255),
    price_per_night NUMERIC(38,2)
);

CREATE TABLE customer (
    id    BIGSERIAL PRIMARY KEY,
    name  VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(255)
);

CREATE TABLE app_user (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role          VARCHAR(255)
);

CREATE TABLE reservation (
    id          BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customer(id),
    room_id     BIGINT NOT NULL REFERENCES room(id),
    check_in    DATE,
    check_out   DATE,
    total_price NUMERIC(38,2),
    status      VARCHAR(255)
);

INSERT INTO room (room_number, type, price_per_night) VALUES
    ('101', 'SINGLE', 80),
    ('102', 'DOUBLE', 120),
    ('201', 'SUITE', 250);
