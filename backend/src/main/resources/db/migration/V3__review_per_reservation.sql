-- A review belongs to one completed stay, and each stay can be reviewed once.
DELETE FROM review;
ALTER TABLE review ADD COLUMN reservation_id BIGINT NOT NULL UNIQUE REFERENCES reservation(id);
