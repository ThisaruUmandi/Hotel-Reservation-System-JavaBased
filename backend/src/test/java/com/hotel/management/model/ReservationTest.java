package com.hotel.management.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class ReservationTest {
    private Guest guest;
    private Room double102;
    private final LocalDate today = LocalDate.of(2030, 6, 10);

    @BeforeEach
    void setUp() {
        guest = new Guest("Test Guest", "t@example.com", "0771234567");
        double102 = new Room("102", new RoomType("DOUBLE", "d", 2, "Wi-Fi"), new BigDecimal("120"));
    }

    @Test
    void priceIsNightsTimesRate() {
        Reservation r = new Reservation(guest, double102, today, today.plusDays(3), 2);
        assertEquals(3, r.nights());
        assertEquals(0, new BigDecimal("360").compareTo(r.getTotalPrice()));
        assertEquals(ReservationStatus.CONFIRMED, r.getStatus());
    }

    @Test
    void rejectsCheckOutNotAfterCheckIn() {
        assertThrows(IllegalArgumentException.class, () -> new Reservation(guest, double102, today, today, 1));
        assertThrows(IllegalArgumentException.class, () -> new Reservation(guest, double102, today, today.minusDays(1), 1));
    }

    @Test
    void rejectsMoreGuestsThanCapacity() {
        assertThrows(IllegalArgumentException.class, () -> new Reservation(guest, double102, today, today.plusDays(1), 3));
    }

    @Test
    void canBeCancelledBeforeCheckIn() {
        Reservation r = new Reservation(guest, double102, today.plusDays(5), today.plusDays(7), 1);
        r.cancel(today);
        assertEquals(ReservationStatus.CANCELLED, r.getStatus());
    }

    @Test
    void cannotBeCancelledOnceStarted() {
        Reservation r = new Reservation(guest, double102, today, today.plusDays(2), 1);
        assertThrows(IllegalStateException.class, () -> r.cancel(today));
    }

    @Test
    void cannotBeCancelledTwice() {
        Reservation r = new Reservation(guest, double102, today.plusDays(5), today.plusDays(7), 1);
        r.cancel(today);
        assertThrows(IllegalStateException.class, () -> r.cancel(today));
    }

    @Test
    void reviewableOnlyAfterStayEndsAndNotWhenCancelled() {
        Reservation r = new Reservation(guest, double102, today, today.plusDays(2), 1);
        assertFalse(r.isReviewable(today.plusDays(1)));
        assertTrue(r.isReviewable(today.plusDays(2)));

        Reservation cancelled = new Reservation(guest, double102, today.plusDays(5), today.plusDays(7), 1);
        cancelled.cancel(today);
        assertFalse(cancelled.isReviewable(today.plusDays(30)));
    }
}
