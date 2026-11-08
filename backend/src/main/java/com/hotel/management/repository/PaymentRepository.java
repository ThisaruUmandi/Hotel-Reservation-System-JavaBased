package com.hotel.management.repository;

import com.hotel.management.model.Payment;
import com.hotel.management.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByReservationId(Long reservationId);
    boolean existsByReservationIdAndStatus(Long reservationId, PaymentStatus status);

    @Query("select p.reservation.id from Payment p where p.status = com.hotel.management.model.PaymentStatus.PAID and p.reservation.id in :ids")
    Set<Long> findPaidReservationIds(@Param("ids") Collection<Long> ids);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.status = com.hotel.management.model.PaymentStatus.PAID")
    BigDecimal totalPaid();
}
