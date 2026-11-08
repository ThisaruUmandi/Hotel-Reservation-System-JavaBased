package com.hotel.management.service;

import com.hotel.management.dto.PaymentOptionsResponse;
import com.hotel.management.exception.ConflictException;
import com.hotel.management.exception.ResourceNotFoundException;
import com.hotel.management.gateway.*;
import com.hotel.management.model.*;
import com.hotel.management.repository.PaymentRepository;
import com.hotel.management.security.AuthenticatedUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Online payments through a gateway. The rule that matters most: a booking is only marked paid when the
 * gateway's own server tells us so, with a valid signature and the right amount. Nothing the guest's browser
 * says is trusted.
 */
@Service
public class OnlinePaymentService {
    private final List<PaymentGateway> gateways;
    private final PaymentRepository payments;
    private final ReservationAccess access;

    public OnlinePaymentService(List<PaymentGateway> gateways, PaymentRepository payments, ReservationAccess access) {
        this.gateways = gateways; this.payments = payments; this.access = access;
    }

    public Optional<PaymentGateway> activeGateway() { return gateways.stream().filter(PaymentGateway::isEnabled).findFirst(); }

    public boolean isEnabled() { return activeGateway().isPresent(); }

    public PaymentOptionsResponse options() {
        Optional<PaymentGateway> g = activeGateway();
        return new PaymentOptionsResponse(g.isPresent(), g.map(PaymentGateway::displayName).orElse(null),
                g.map(PaymentGateway::isSandbox).orElse(false), g.isEmpty());
    }

    /** Creates a pending payment and returns the form the browser must post to the gateway. */
    @Transactional
    public CheckoutForm startCheckout(AuthenticatedUser actor, Long reservationId) {
        PaymentGateway gateway = activeGateway().orElseThrow(() -> new ConflictException("Online payment is not available right now"));
        Reservation reservation = access.load(reservationId, actor);
        if (reservation.getStatus() != ReservationStatus.CONFIRMED) throw new ConflictException("Only confirmed reservations can be paid");
        if (reservation.getCheckOut().isBefore(LocalDate.now())) throw new ConflictException("This stay is over");
        if (payments.existsByReservationIdAndStatus(reservationId, PaymentStatus.PAID)) throw new ConflictException("This reservation is already paid");

        // A fresh order id for every attempt, so a retry after an abandoned page never clashes with the first try.
        String orderId = "RES" + reservationId + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        GatewayPayment payment = payments.save(new GatewayPayment(reservation, gateway.name(), orderId));
        return gateway.createCheckout(payment, reservation);
    }

    /** Handles a server-to-server notification from the gateway. Safe to receive more than once. */
    @Transactional
    public void handleNotification(String gatewayName, Map<String, String> params) {
        PaymentGateway gateway = gateways.stream().filter(g -> g.name().equals(gatewayName) && g.isEnabled()).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Unknown gateway"));
        GatewayNotification n = gateway.verify(params); // throws unless the signature is genuine

        GatewayPayment payment = payments.findByOrderId(n.orderId()).orElseThrow(() -> new ResourceNotFoundException("Unknown order"));
        // The signature proves PayHere sent it; this proves it is about the amount we asked for.
        if (n.amount().compareTo(payment.getAmount()) != 0 || !"LKR".equalsIgnoreCase(n.currency()))
            throw new IllegalArgumentException("Amount does not match the order");

        switch (n.outcome()) {
            case PAID -> {
                payment.confirm(n.gatewayPaymentId(), n.method(), n.message());
                // Money arrived for a booking cancelled in the meantime: it has to go back.
                if (payment.getReservation().getStatus() == ReservationStatus.CANCELLED && payment.getStatus() == PaymentStatus.PAID) payment.refund();
            }
            case FAILED -> payment.recordFailure(n.message());
            case CHARGED_BACK -> payment.recordChargeback(n.message());
            case PENDING -> { /* wait for the final answer */ }
        }
        payments.save(payment);
    }
}
