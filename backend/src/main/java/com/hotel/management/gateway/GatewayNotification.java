package com.hotel.management.gateway;

import java.math.BigDecimal;

/** A notification whose signature has already been checked. */
public record GatewayNotification(String orderId, String gatewayPaymentId, BigDecimal amount, String currency,
                                  GatewayOutcome outcome, String method, String message) {}
