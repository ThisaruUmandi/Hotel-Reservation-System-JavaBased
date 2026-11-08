package com.hotel.management.exception;

import java.time.Duration;

public class TooManyAttemptsException extends RuntimeException {
    private final Duration retryAfter;

    public TooManyAttemptsException(Duration retryAfter) {
        super("Too many failed attempts. Please try again in " + Math.max(1, (retryAfter.toSeconds() + 59) / 60) + " minute(s).");
        this.retryAfter = retryAfter;
    }

    public Duration getRetryAfter() { return retryAfter; }
}
