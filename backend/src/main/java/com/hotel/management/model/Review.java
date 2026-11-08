package com.hotel.management.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Review {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(optional = false) private Reservation reservation;
    @ManyToOne(optional = false) private Guest guest;
    @ManyToOne(optional = false) private Room room;
    @Column(nullable = false) private int rating;
    private String comment;
    @Column(nullable = false) private LocalDateTime createdAt = LocalDateTime.now();

    protected Review() {}

    /** A review is always written about a finished stay, so guest and room come from the reservation. */
    public Review(Reservation reservation, int rating, String comment) {
        if (rating < 1 || rating > 5) throw new IllegalArgumentException("Rating must be between 1 and 5");
        this.reservation = reservation;
        this.guest = reservation.getGuest();
        this.room = reservation.getRoom();
        this.rating = rating;
        this.comment = comment;
    }

    public Long getId() { return id; }
    public Reservation getReservation() { return reservation; }
    public Guest getGuest() { return guest; }
    public Room getRoom() { return room; }
    public int getRating() { return rating; }
    public String getComment() { return comment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
