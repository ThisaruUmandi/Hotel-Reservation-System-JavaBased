package com.hotel.management.dto;

import jakarta.validation.constraints.*;

public record ReviewRequest(
        @NotNull(message = "Reservation is required") Long reservationId,
        @NotNull(message = "Rating is required") @Min(value = 1, message = "Rating must be 1-5") @Max(value = 5, message = "Rating must be 1-5") Integer rating,
        @Size(max = 1000, message = "Comment is too long") String comment) {}
