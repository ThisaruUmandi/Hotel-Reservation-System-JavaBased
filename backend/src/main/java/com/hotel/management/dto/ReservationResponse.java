package com.hotel.management.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ReservationResponse(Long id, GuestResponse guest, RoomResponse room, LocalDate checkIn,
                                  LocalDate checkOut, long nights, int numberOfGuests, BigDecimal totalPrice,
                                  String status, boolean reviewed, boolean paid, LocalDateTime createdAt) {}
