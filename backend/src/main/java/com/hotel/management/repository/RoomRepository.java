package com.hotel.management.repository;

import com.hotel.management.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {
    @Query("select r from Room r where r.status = com.hotel.management.model.RoomStatus.AVAILABLE "
            + "and r.roomType.capacity >= :guests "
            + "and not exists (select 1 from Reservation x where x.room = r "
            + "and x.status = com.hotel.management.model.ReservationStatus.CONFIRMED "
            + "and x.checkIn < :checkOut and x.checkOut > :checkIn) "
            + "order by r.pricePerNight")
    List<Room> findAvailable(@Param("checkIn") LocalDate checkIn, @Param("checkOut") LocalDate checkOut,
                             @Param("guests") int guests);
}
