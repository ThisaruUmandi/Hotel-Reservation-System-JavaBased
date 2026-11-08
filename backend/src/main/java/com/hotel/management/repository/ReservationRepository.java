package com.hotel.management.repository;

import com.hotel.management.model.Reservation;
import com.hotel.management.model.ReservationStatus;
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

    // Written out in full: in a derived name like countByCheckInAnd..., Spring Data reads "In" as the IN operator.
    @Query("select count(r) from Reservation r where r.checkIn = :day and r.status = :status")
    long countArrivals(@Param("day") LocalDate day, @Param("status") ReservationStatus status);

    @Query("select count(r) from Reservation r where r.checkOut = :day and r.status = :status")
    long countDepartures(@Param("day") LocalDate day, @Param("status") ReservationStatus status);

    @Query("select count(r) from Reservation r where r.status = com.hotel.management.model.ReservationStatus.CONFIRMED "
            + "and r.checkIn <= :day and r.checkOut > :day")
    long countInHouse(@Param("day") LocalDate day);

    /** Live bookings not yet paid, including guests who leave today and still owe the desk. */
    @Query("select count(r) from Reservation r where r.status = com.hotel.management.model.ReservationStatus.CONFIRMED "
            + "and r.checkOut >= :day and not exists (select 1 from Payment p where p.reservation = r "
            + "and p.status = com.hotel.management.model.PaymentStatus.PAID)")
    long countAwaitingPayment(@Param("day") LocalDate day);
}
