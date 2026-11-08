package com.hotel.management.repository;

import com.hotel.management.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByRoomIdOrderByCreatedAtDesc(Long roomId);
    boolean existsByReservationId(Long reservationId);

    @Query("select r.reservation.id from Review r where r.reservation.id in :ids")
    Set<Long> findReviewedReservationIds(@Param("ids") Collection<Long> ids);
}
