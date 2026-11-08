package com.hotel.management.repository;

import com.hotel.management.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    @Query("select count(r) > 0 from Reservation r where r.room.id = :roomId and r.status = com.hotel.management.model.ReservationStatus.CONFIRMED "
            + "and r.checkIn < :checkOut and r.checkOut > :checkIn")
    boolean existsOverlap(@Param("roomId") Long roomId, @Param("checkIn") LocalDate checkIn,
                          @Param("checkOut") LocalDate checkOut);
    List<Reservation> findByGuestIdOrderByCheckInDesc(Long guestId);
}
