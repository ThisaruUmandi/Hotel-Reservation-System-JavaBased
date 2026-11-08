package com.hotel.management.dto;

import jakarta.validation.constraints.NotNull;

public record OnlineCheckoutRequest(@NotNull(message = "Reservation is required") Long reservationId) {}
