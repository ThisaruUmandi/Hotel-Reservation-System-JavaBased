package com.hotel.management.service;

import com.hotel.management.exception.ConflictException;
import com.hotel.management.exception.ResourceNotFoundException;
import com.hotel.management.model.*;
import com.hotel.management.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ReservationService {
    private final ReservationRepository reservations;
    private final RoomRepository rooms;
    private final GuestRepository guests;
    private final PaymentRepository payments;

    public ReservationService(ReservationRepository reservations, RoomRepository rooms, GuestRepository guests,
                              PaymentRepository payments) {
        this.reservations = reservations; this.rooms = rooms; this.guests = guests; this.payments = payments;
    }

    public List<Reservation> findAll() { return reservations.findAll(); }

    public Reservation get(Long id) {
        return reservations.findById(id).orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
    }

    @Transactional
    public Reservation create(Long roomId, Guest guest, int numberOfGuests, LocalDate in, LocalDate out) {
        Room room = rooms.findById(roomId).orElseThrow(() -> new ResourceNotFoundException("Room not found"));
        if (!room.isBookable()) throw new ConflictException("Room is not available for booking");
        if (in.isBefore(LocalDate.now())) throw new IllegalArgumentException("checkIn cannot be in the past");
        if (reservations.existsOverlap(roomId, in, out))
            throw new ConflictException("Room is not available for those dates");
        Guest saved = guests.findByEmail(guest.getEmail()).orElseGet(() -> guests.save(guest));
        return reservations.save(new Reservation(saved, room, in, out, numberOfGuests));
    }

    @Transactional
    public Reservation cancel(Long id) {
        Reservation r = get(id);
        r.cancel(LocalDate.now());
        // A cancelled booking gets its money back.
        payments.findByReservationId(id).stream()
                .filter(p -> p.getStatus() == PaymentStatus.PAID)
                .forEach(Payment::refund);
        return reservations.save(r);
    }
}
