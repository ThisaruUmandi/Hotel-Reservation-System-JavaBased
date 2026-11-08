package com.hotel.management.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record BookingRequest(
        @NotNull(message = "Room is required") Long roomId,
        @NotBlank(message = "Name is required") @Size(max = 100) String name,
        @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") String email,
        @Pattern(regexp = "^[0-9+\\- ]{7,20}$", message = "Enter a valid phone number") String phone,
        @NotNull(message = "Number of guests is required") @Min(value = 1, message = "At least 1 guest") @Max(value = 10) Integer guests,
        @NotNull(message = "Check-in date is required") @FutureOrPresent(message = "Check-in cannot be in the past") LocalDate checkIn,
        @NotNull(message = "Check-out date is required") @Future(message = "Check-out must be in the future") LocalDate checkOut) {}
