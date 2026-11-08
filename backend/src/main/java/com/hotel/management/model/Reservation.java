package com.hotel.management.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
public class Reservation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) private Guest guest;
    @ManyToOne(optional = false) private Room room;
    @Column(nullable = false) private LocalDate checkIn;
    @Column(nullable = false) private LocalDate checkOut;
    @Column(nullable = false) private int numberOfGuests = 1;
    @Column(nullable = false) private BigDecimal totalPrice;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private ReservationStatus status = ReservationStatus.CONFIRMED;
    @Column(nullable = false) private LocalDateTime createdAt = LocalDateTime.now();

    protected Reservation() {}

    /** Validates the dates and works out the price, so an invalid Reservation can't exist. */
    public Reservation(Guest guest, Room room, LocalDate checkIn, LocalDate checkOut, int numberOfGuests) {
        if (!checkOut.isAfter(checkIn)) throw new IllegalArgumentException("checkOut must be after checkIn");
        if (!room.canHost(numberOfGuests)) throw new IllegalArgumentException("Room cannot host that many guests");
        this.guest = guest; this.room = room;
        this.checkIn = checkIn; this.checkOut = checkOut;
        this.numberOfGuests = numberOfGuests;
        this.totalPrice = room.priceFor(nights());
    }

    public long nights() { return ChronoUnit.DAYS.between(checkIn, checkOut); }

    /** A guest can review once the stay has ended and it was not cancelled. */
    public boolean isReviewable(LocalDate today) {
        return status == ReservationStatus.CONFIRMED && !checkOut.isAfter(today);
    }

    public void cancel(LocalDate today) {
        if (!checkIn.isAfter(today))
            throw new IllegalStateException("A reservation that has already started cannot be cancelled");
        if (status != ReservationStatus.CONFIRMED)
            throw new IllegalStateException("Only confirmed reservations can be cancelled");
        status = ReservationStatus.CANCELLED;
    }

    public Long getId() { return id; }
    public Guest getGuest() { return guest; }
    public Room getRoom() { return room; }
    public LocalDate getCheckIn() { return checkIn; }
    public LocalDate getCheckOut() { return checkOut; }
    public int getNumberOfGuests() { return numberOfGuests; }
    public BigDecimal getTotalPrice() { return totalPrice; }
    public ReservationStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
