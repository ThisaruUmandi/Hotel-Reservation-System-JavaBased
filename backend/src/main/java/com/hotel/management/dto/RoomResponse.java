package com.hotel.management.dto;

import java.math.BigDecimal;

public record RoomResponse(Long id, String roomNumber, RoomTypeResponse type, BigDecimal pricePerNight,
                           int floor, String status, String imageUrl) {}
