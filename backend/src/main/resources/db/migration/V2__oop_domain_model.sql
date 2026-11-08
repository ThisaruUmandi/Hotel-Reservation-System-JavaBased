-- Room types
CREATE TABLE room_type (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(500),
    capacity    INT          NOT NULL,
    amenities   VARCHAR(500)
);

INSERT INTO room_type (name, description, capacity, amenities) VALUES
    ('SINGLE', 'A quiet room for a solo traveller', 1, 'Wi-Fi,Air conditioning,Work desk'),
    ('DOUBLE', 'A comfortable room with a king-size bed', 2, 'Wi-Fi,Air conditioning,Balcony'),
    ('SUITE',  'A spacious suite with a living area', 4, 'Wi-Fi,Air conditioning,Living area,Mini bar,Bathtub');

-- Room
ALTER TABLE room ADD COLUMN room_type_id BIGINT REFERENCES room_type(id);
UPDATE room r SET room_type_id = (SELECT t.id FROM room_type t WHERE t.name = r.type);
ALTER TABLE room ALTER COLUMN room_type_id SET NOT NULL;
ALTER TABLE room DROP COLUMN type;
ALTER TABLE room ADD COLUMN floor     INT         NOT NULL DEFAULT 1;
ALTER TABLE room ADD COLUMN status    VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE';
ALTER TABLE room ADD COLUMN image_url VARCHAR(500);
ALTER TABLE room ALTER COLUMN price_per_night SET NOT NULL;
UPDATE room SET floor = 2 WHERE room_number LIKE '2%';

-- Customer becomes Guest
ALTER TABLE customer RENAME TO guest;
ALTER TABLE guest ALTER COLUMN name  SET NOT NULL;
ALTER TABLE guest ALTER COLUMN email SET NOT NULL;

-- Users get a role and an optional guest profile
ALTER TABLE app_user ADD COLUMN guest_id BIGINT REFERENCES guest(id);
UPDATE app_user SET role = 'GUEST' WHERE role IS NULL;
ALTER TABLE app_user ALTER COLUMN role SET NOT NULL;
ALTER TABLE app_user ALTER COLUMN password_hash SET NOT NULL;

-- Reservation
ALTER TABLE reservation RENAME COLUMN customer_id TO guest_id;
ALTER TABLE reservation ADD COLUMN number_of_guests INT NOT NULL DEFAULT 1;
ALTER TABLE reservation ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT now();
ALTER TABLE reservation ALTER COLUMN check_in    SET NOT NULL;
ALTER TABLE reservation ALTER COLUMN check_out   SET NOT NULL;
ALTER TABLE reservation ALTER COLUMN total_price SET NOT NULL;
ALTER TABLE reservation ALTER COLUMN status      SET NOT NULL;
ALTER TABLE reservation ADD CONSTRAINT chk_reservation_dates CHECK (check_out > check_in);
CREATE INDEX idx_reservation_room_dates ON reservation (room_id, check_in, check_out);

-- Payments (one table, card and cash subclasses)
CREATE TABLE payment (
    id             BIGSERIAL PRIMARY KEY,
    payment_type   VARCHAR(20)    NOT NULL,
    reservation_id BIGINT         NOT NULL REFERENCES reservation(id),
    amount         NUMERIC(38,2)  NOT NULL,
    status         VARCHAR(20)    NOT NULL,
    paid_at        TIMESTAMP,
    card_brand     VARCHAR(30),
    card_last4     VARCHAR(4),
    received_by    VARCHAR(100)
);

-- Reviews
CREATE TABLE review (
    id         BIGSERIAL PRIMARY KEY,
    guest_id   BIGINT        NOT NULL REFERENCES guest(id),
    room_id    BIGINT        NOT NULL REFERENCES room(id),
    rating     INT           NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    VARCHAR(1000),
    created_at TIMESTAMP     NOT NULL DEFAULT now()
);
