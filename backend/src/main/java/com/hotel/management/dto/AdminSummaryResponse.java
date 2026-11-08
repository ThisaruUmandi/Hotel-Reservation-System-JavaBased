package com.hotel.management.dto;

import java.math.BigDecimal;

public record AdminSummaryResponse(long arrivalsToday, long departuresToday, long inHouse, long totalRooms,
                                   long awaitingPayment, BigDecimal collected) {}
