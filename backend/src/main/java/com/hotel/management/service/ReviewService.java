package com.hotel.management.service;

import com.hotel.management.dto.ReviewRequest;
import com.hotel.management.exception.ConflictException;
import com.hotel.management.exception.ResourceNotFoundException;
import com.hotel.management.model.Reservation;
import com.hotel.management.model.Review;
import com.hotel.management.security.AuthenticatedUser;
import com.hotel.management.repository.ReviewRepository;
import com.hotel.management.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ReviewService {
    private final ReviewRepository reviews;
    private final ReservationAccess access;
    private final RoomRepository rooms;

    public ReviewService(ReviewRepository reviews, ReservationAccess access, RoomRepository rooms) {
        this.reviews = reviews; this.access = access; this.rooms = rooms;
    }

    public Review add(AuthenticatedUser actor, ReviewRequest req) {
        Reservation reservation = access.load(req.reservationId(), actor);
        if (!reservation.isReviewable(LocalDate.now()))
            throw new ConflictException("You can review a room only after a completed stay");
        if (reviews.existsByReservationId(reservation.getId()))
            throw new ConflictException("This stay has already been reviewed");
        return reviews.save(new Review(reservation, req.rating(), req.comment()));
    }

    public List<Review> forRoom(Long roomId) {
        if (!rooms.existsById(roomId)) throw new ResourceNotFoundException("Room not found");
        return reviews.findByRoomIdOrderByCreatedAtDesc(roomId);
    }
}
