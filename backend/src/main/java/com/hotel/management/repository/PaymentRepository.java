package com.hotel.management.repository;

import com.hotel.management.model.Payment;
import com.hotel.management.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByReservationId(Long reservationId);
    boolean existsByReservationIdAndStatus(Long reservationId, PaymentStatus status);
}
