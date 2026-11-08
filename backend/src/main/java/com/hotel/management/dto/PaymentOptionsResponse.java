package com.hotel.management.dto;

/** Which ways of paying are switched on right now. The demo card is available only when no real gateway is. */
public record PaymentOptionsResponse(boolean onlineEnabled, String onlineProvider, boolean sandbox, boolean demoCardEnabled) {}
