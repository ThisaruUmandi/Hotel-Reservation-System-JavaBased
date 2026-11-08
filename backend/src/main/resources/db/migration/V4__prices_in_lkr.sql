-- Prices are in Sri Lankan rupees (LKR) from now on. Earlier seed prices were placeholder numbers.
UPDATE room SET price_per_night = 12000 WHERE room_type_id = (SELECT id FROM room_type WHERE name = 'SINGLE');
UPDATE room SET price_per_night = 18500 WHERE room_type_id = (SELECT id FROM room_type WHERE name = 'DOUBLE');
UPDATE room SET price_per_night = 42000 WHERE room_type_id = (SELECT id FROM room_type WHERE name = 'SUITE');

-- Keep any existing reservations consistent with the new rates.
UPDATE reservation r
   SET total_price = (r.check_out - r.check_in) * rm.price_per_night
  FROM room rm
 WHERE rm.id = r.room_id;
