package com.hotel.management.service;

import com.hotel.management.dto.AdminSummaryResponse;
import com.hotel.management.model.PaymentStatus;
import com.hotel.management.model.ReservationStatus;
import com.hotel.management.repository.PaymentRepository;
import com.hotel.management.repository.ReservationRepository;
import com.hotel.management.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class DashboardService {
    private final ReservationRepository reservations;
    private final RoomRepository rooms;
    private final PaymentRepository payments;

    public DashboardService(ReservationRepository reservations, RoomRepository rooms, PaymentRepository payments) {
        this.reservations = reservations; this.rooms = rooms; this.payments = payments;
    }

    public AdminSummaryResponse summary() {
        LocalDate today = LocalDate.now();
        return new AdminSummaryResponse(
                reservations.countArrivals(today, ReservationStatus.CONFIRMED),
                reservations.countDepartures(today, ReservationStatus.CONFIRMED),
                reservations.countInHouse(today),
                rooms.count(),
                reservations.countAwaitingPayment(today),
                payments.countByStatus(PaymentStatus.REFUND_PENDING),
                payments.totalPaid());
    }
}
