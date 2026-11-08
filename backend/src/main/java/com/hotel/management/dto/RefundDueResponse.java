package com.hotel.management.dto;

import java.math.BigDecimal;

public record RefundDueResponse(Long paymentId, Long reservationId, String guestName, String guestEmail,
                                BigDecimal amount, String description) {}
