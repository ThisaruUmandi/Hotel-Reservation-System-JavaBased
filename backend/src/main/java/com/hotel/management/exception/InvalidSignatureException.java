package com.hotel.management.exception;

/** A payment notification that did not carry a valid signature, so it did not come from the gateway. */
public class InvalidSignatureException extends RuntimeException {
    public InvalidSignatureException() { super("Invalid notification"); }
}
