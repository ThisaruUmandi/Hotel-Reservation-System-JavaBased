package com.hotel.management.service;

import com.hotel.management.dto.PaymentRequest;
import com.hotel.management.exception.ConflictException;
import com.hotel.management.exception.ResourceNotFoundException;
import com.hotel.management.model.*;
import com.hotel.management.repository.PaymentRepository;
import com.hotel.management.repository.ReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Simulated payments: no real card gateway yet, but the rules and data model are the real ones. */
@Service
public class PaymentService {
    private final PaymentRepository payments;
    private final ReservationRepository reservations;

    public PaymentService(PaymentRepository payments, ReservationRepository reservations) {
        this.payments = payments; this.reservations = reservations;
    }

    @Transactional
    public Payment pay(PaymentRequest req) {
        Reservation reservation = reservations.findById(req.reservationId())
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
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

    public List<Payment> forReservation(Long reservationId) {
        if (!reservations.existsById(reservationId)) throw new ResourceNotFoundException("Reservation not found");
        return payments.findByReservationId(reservationId);
    }

    private String brandOf(String digits) {
        if (digits.startsWith("4")) return "Visa";
        if (digits.matches("^(5[1-5]|2[2-7]).*")) return "Mastercard";
        if (digits.matches("^3[47].*")) return "Amex";
        return "Card";
    }
}
