package com.hotel.management.dto;

import com.hotel.management.model.RoomStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

/** Either field may be left out to keep its current value. */
public record RoomUpdateRequest(
        @Positive(message = "Price must be more than zero") @DecimalMax(value = "10000000", message = "Price is too high") BigDecimal pricePerNight,
        RoomStatus status) {}
