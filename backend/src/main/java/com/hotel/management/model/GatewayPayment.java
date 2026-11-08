package com.hotel.management.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

/**
 * A payment made on an online gateway's own page. It starts PENDING and only becomes PAID when the gateway's
 * server tells us so. We never see the card details.
 */
@Entity
@DiscriminatorValue("GATEWAY")
public class GatewayPayment extends Payment {
    private String provider;
    @Column(name = "order_id", unique = true)
    private String orderId;
    @Column(name = "gateway_payment_id")
    private String gatewayPaymentId;
    @Column(name = "gateway_method")
    private String gatewayMethod;
    @Column(name = "gateway_message")
    private String gatewayMessage;

    protected GatewayPayment() {}

    public GatewayPayment(Reservation reservation, String provider, String orderId) {
        super(reservation);
        this.provider = provider;
        this.orderId = orderId;
    }

    /** The gateway confirmed the money arrived. Repeated confirmations change nothing. */
    public void confirm(String gatewayPaymentId, String method, String message) {
        if (getStatus() == PaymentStatus.PAID) return;
        this.gatewayPaymentId = gatewayPaymentId;
        this.gatewayMethod = method;
        this.gatewayMessage = message;
        markPaid();
    }

    public void recordFailure(String message) {
        this.gatewayMessage = message;
        markFailed();
    }

    /** The card network took the money back (a chargeback). */
    public void recordChargeback(String message) {
        if (getStatus() != PaymentStatus.PAID) return;
        this.gatewayMessage = message;
        setStatus(PaymentStatus.REFUNDED);
    }

    /** Money paid online has to be sent back by a person in the gateway's dashboard, so it waits for them. */
    @Override
    public void refund() {
        if (getStatus() != PaymentStatus.PAID) throw new IllegalStateException("Only paid payments can be refunded");
        setStatus(PaymentStatus.REFUND_PENDING);
    }

    @Override
    public PaymentMethod getMethod() { return PaymentMethod.ONLINE; }

    @Override
    public String describe() {
        return gatewayMethod == null || gatewayMethod.isBlank() ? "Online payment" : "Online payment (" + gatewayMethod + ")";
    }

    public String getProvider() { return provider; }
    public String getOrderId() { return orderId; }
    public String getGatewayPaymentId() { return gatewayPaymentId; }
}
