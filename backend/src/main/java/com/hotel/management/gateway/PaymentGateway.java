package com.hotel.management.gateway;

import com.hotel.management.model.GatewayPayment;
import com.hotel.management.model.Reservation;

import java.util.Map;

/** One online payment provider. Adding another gateway means writing another implementation of this. */
public interface PaymentGateway {
    /** Short identifier stored with each payment, e.g. PAYHERE. */
    String name();

    String displayName();

    /** False until the provider's keys are configured. */
    boolean isEnabled();

    boolean isSandbox();

    CheckoutForm createCheckout(GatewayPayment payment, Reservation reservation);

    /** Checks the signature of an incoming notification and translates it. Throws if it is not genuine. */
    GatewayNotification verify(Map<String, String> notification);
}
