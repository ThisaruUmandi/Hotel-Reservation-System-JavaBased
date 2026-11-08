-- Payments made through an online gateway (PayHere). They share the payment table with card and cash payments.
ALTER TABLE payment ADD COLUMN provider           VARCHAR(30);
ALTER TABLE payment ADD COLUMN order_id           VARCHAR(60) UNIQUE;
ALTER TABLE payment ADD COLUMN gateway_payment_id VARCHAR(60);
ALTER TABLE payment ADD COLUMN gateway_method     VARCHAR(30);
ALTER TABLE payment ADD COLUMN gateway_message    VARCHAR(255);
