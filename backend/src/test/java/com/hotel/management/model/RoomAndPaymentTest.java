package com.hotel.management.model;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class RoomAndPaymentTest {
    private final Guest guest = new Guest("G", "g@example.com", null);
    private final Room suite = new Room("201", new RoomType("SUITE", "s", 4, ""), new BigDecimal("250"));

    @Test
    void roomChecksCapacityAndStatus() {
        assertTrue(suite.canHost(4));
        assertFalse(suite.canHost(5));
        assertTrue(suite.isBookable());
        suite.setStatus(RoomStatus.MAINTENANCE);
        assertFalse(suite.isBookable());
    }

    @Test
    void roomPriceForNights() {
        assertEquals(0, new BigDecimal("750").compareTo(suite.priceFor(3)));
    }

    @Test
    void paymentsDescribeThemselvesPolymorphically() {
        Reservation r = new Reservation(guest, suite, LocalDate.now().plusDays(5), LocalDate.now().plusDays(6), 1);
        Payment card = new CardPayment(r, "Visa", "4242");
        Payment cash = new CashPayment(r, "Nimal");
        assertEquals("Visa ending 4242", card.describe());
        assertEquals(PaymentMethod.CARD, card.getMethod());
        assertEquals("Cash received by Nimal", cash.describe());
        assertEquals(PaymentMethod.CASH, cash.getMethod());
        assertEquals(0, r.getTotalPrice().compareTo(card.getAmount()));
    }

    @Test
    void refundOnlyAfterPaid() {
        Reservation r = new Reservation(guest, suite, LocalDate.now().plusDays(5), LocalDate.now().plusDays(6), 1);
        Payment p = new CashPayment(r, "Nimal");
        assertEquals(PaymentStatus.PENDING, p.getStatus());
        assertThrows(IllegalStateException.class, p::refund);
        p.markPaid();
        assertEquals(PaymentStatus.PAID, p.getStatus());
        assertNotNull(p.getPaidAt());
        p.refund();
        assertEquals(PaymentStatus.REFUNDED, p.getStatus());
    }

    @Test
    void reviewRatingMustBeOneToFive() {
        Reservation r = new Reservation(guest, suite, LocalDate.now().plusDays(5), LocalDate.now().plusDays(6), 1);
        assertThrows(IllegalArgumentException.class, () -> new Review(r, 0, "x"));
        assertThrows(IllegalArgumentException.class, () -> new Review(r, 6, "x"));
        assertEquals(5, new Review(r, 5, "great").getRating());
    }
}
