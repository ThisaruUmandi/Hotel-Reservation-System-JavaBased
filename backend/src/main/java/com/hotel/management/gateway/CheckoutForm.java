package com.hotel.management.gateway;

import java.util.Map;

/** Where to send the guest and what to send: the browser posts these fields to the gateway's page. */
public record CheckoutForm(String url, Map<String, String> fields) {}
