package com.hotel.management.repository;

import com.hotel.management.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByRoomIdOrderByCreatedAtDesc(Long roomId);
    boolean existsByReservationId(Long reservationId);
}
