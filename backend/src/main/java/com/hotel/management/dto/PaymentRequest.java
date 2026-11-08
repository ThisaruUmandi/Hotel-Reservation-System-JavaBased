package com.hotel.management.dto;

import com.hotel.management.model.PaymentMethod;
import jakarta.validation.constraints.*;

/** For CARD, only the last 4 digits and brand are kept; the full number is never stored or logged. */
public record PaymentRequest(
        @NotNull(message = "Reservation is required") Long reservationId,
        @NotNull(message = "Payment method is required") PaymentMethod method,
        @Pattern(regexp = "^[0-9 ]{12,23}$", message = "Enter a valid card number") String cardNumber,
        @Size(max = 100) String receivedBy) {}
