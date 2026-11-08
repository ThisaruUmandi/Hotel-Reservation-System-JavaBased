package com.hotel.management.dto;

import java.time.LocalDateTime;

public record ReviewResponse(Long id, String guestName, int rating, String comment, LocalDateTime createdAt) {}
