package com.hotel.management.service;

import com.hotel.management.dto.PaymentRequest;
import com.hotel.management.exception.ConflictException;
import com.hotel.management.exception.ForbiddenException;
import com.hotel.management.security.AuthenticatedUser;
import com.hotel.management.model.*;
import com.hotel.management.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Simulated payments: no real card gateway yet, but the rules and data model are the real ones. */
@Service
public class PaymentService {
    private final PaymentRepository payments;
    private final ReservationAccess access;

    public PaymentService(PaymentRepository payments, ReservationAccess access) {
        this.payments = payments; this.access = access;
    }

    @Transactional
    public Payment pay(AuthenticatedUser actor, PaymentRequest req) {
        Reservation reservation = access.load(req.reservationId(), actor);
        if (req.method() == PaymentMethod.CASH && !actor.isStaff())
            throw new ForbiddenException("Cash payments are recorded by hotel staff");
        if (reservation.getStatus() != ReservationStatus.CONFIRMED)
            throw new ConflictException("Only confirmed reservations can be paid");
        if (payments.existsByReservationIdAndStatus(reservation.getId(), PaymentStatus.PAID))
            throw new ConflictException("This reservation is already paid");

        Payment payment = switch (req.method()) {
            case CARD -> {
                if (req.cardNumber() == null || req.cardNumber().isBlank())
                    throw new IllegalArgumentException("Card number is required for card payments");
                String digits = req.cardNumber().replaceAll("\\s", "");
                yield new CardPayment(reservation, brandOf(digits), digits.substring(digits.length() - 4));
            }
            case CASH -> new CashPayment(reservation,
                    req.receivedBy() == null || req.receivedBy().isBlank() ? "front desk" : req.receivedBy());
        };
        payment.markPaid();
        return payments.save(payment);
    }

    public List<Payment> forReservation(Long reservationId, AuthenticatedUser actor) {
        access.load(reservationId, actor);
        return payments.findByReservationId(reservationId);
    }

    private String brandOf(String digits) {
        if (digits.startsWith("4")) return "Visa";
        if (digits.matches("^(5[1-5]|2[2-7]).*")) return "Mastercard";
        if (digits.matches("^3[47].*")) return "Amex";
        return "Card";
    }
}
