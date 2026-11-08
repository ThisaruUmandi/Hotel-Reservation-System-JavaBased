package com.hotel.management.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/** One place that turns exceptions into consistent JSON error responses. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ErrorResponse> notFound(ResourceNotFoundException e) {
        return ResponseEntity.status(404).body(ErrorResponse.of(404, e.getMessage()));
    }

    @ExceptionHandler(InvalidSignatureException.class)
    ResponseEntity<ErrorResponse> badSignature(InvalidSignatureException e) {
        return ResponseEntity.badRequest().body(ErrorResponse.of(400, "Invalid notification")); // say nothing useful to an attacker
    }

    @ExceptionHandler(TooManyAttemptsException.class)
    ResponseEntity<ErrorResponse> tooMany(TooManyAttemptsException e) {
        return ResponseEntity.status(429).header("Retry-After", String.valueOf(Math.max(1, e.getRetryAfter().toSeconds())))
                .body(ErrorResponse.of(429, e.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    ResponseEntity<ErrorResponse> forbidden(ForbiddenException e) {
        return ResponseEntity.status(403).body(ErrorResponse.of(403, e.getMessage()));
    }

    @ExceptionHandler({ConflictException.class, IllegalStateException.class})
    ResponseEntity<ErrorResponse> conflict(RuntimeException e) {
        return ResponseEntity.status(409).body(ErrorResponse.of(409, e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ErrorResponse> badRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(ErrorResponse.of(400, e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> validation(MethodArgumentNotValidException e) {
        Map<String, String> fields = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors()
                .forEach(f -> fields.putIfAbsent(f.getField(), f.getDefaultMessage()));
        return ResponseEntity.badRequest().body(ErrorResponse.of(400, "Validation failed", fields));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ErrorResponse> unreadable(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(ErrorResponse.of(400, "Malformed JSON or invalid value"));
    }

    @ExceptionHandler({MissingServletRequestParameterException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ErrorResponse> badParameter(Exception e) {
        return ResponseEntity.badRequest().body(ErrorResponse.of(400, "Missing or invalid request parameter"));
    }
}
