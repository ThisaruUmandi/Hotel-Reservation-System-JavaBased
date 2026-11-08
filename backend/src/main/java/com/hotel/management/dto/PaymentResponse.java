package com.hotel.management.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(Long id, Long reservationId, String method, String description,
                              BigDecimal amount, String status, LocalDateTime paidAt) {}
