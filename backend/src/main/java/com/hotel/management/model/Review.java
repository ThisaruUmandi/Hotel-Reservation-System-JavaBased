package com.hotel.management.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Review {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) private Guest guest;
    @ManyToOne(optional = false) private Room room;
    @Column(nullable = false) private int rating;
    private String comment;
    @Column(nullable = false) private LocalDateTime createdAt = LocalDateTime.now();

    protected Review() {}
    public Review(Guest guest, Room room, int rating, String comment) {
        if (rating < 1 || rating > 5) throw new IllegalArgumentException("Rating must be between 1 and 5");
        this.guest = guest; this.room = room; this.rating = rating; this.comment = comment;
    }

    public Long getId() { return id; }
    public Guest getGuest() { return guest; }
    public Room getRoom() { return room; }
    public int getRating() { return rating; }
    public String getComment() { return comment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
