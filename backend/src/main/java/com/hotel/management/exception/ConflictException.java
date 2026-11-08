package com.hotel.management.exception;

/** Thrown when a request is valid but clashes with the current state (e.g. room already booked). */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) { super(message); }
}
