package com.hotel.management.exception;

import java.time.Instant;
import java.util.Map;

public record ErrorResponse(Instant timestamp, int status, String error, Map<String, String> fieldErrors) {
    public static ErrorResponse of(int status, String message) {
        return new ErrorResponse(Instant.now(), status, message, Map.of());
    }
    public static ErrorResponse of(int status, String message, Map<String, String> fields) {
        return new ErrorResponse(Instant.now(), status, message, fields);
    }
}
