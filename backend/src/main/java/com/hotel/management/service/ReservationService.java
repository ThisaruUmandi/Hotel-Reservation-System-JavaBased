package com.hotel.management.service;

import com.hotel.management.model.*;
import com.hotel.management.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ReservationService {
    private final ReservationRepository reservations;
    private final RoomRepository rooms;
    private final GuestRepository guests;

    public ReservationService(ReservationRepository reservations, RoomRepository rooms, GuestRepository guests) {
        this.reservations = reservations; this.rooms = rooms; this.guests = guests;
    }

    public List<Reservation> findAll() { return reservations.findAll(); }

    public Reservation get(Long id) {
        return reservations.findById(id).orElseThrow(() -> new NoSuchElementException("Reservation not found"));
    }

    @Transactional
    public Reservation create(Long roomId, Guest guest, int numberOfGuests, LocalDate in, LocalDate out) {
        Room room = rooms.findById(roomId).orElseThrow(() -> new NoSuchElementException("Room not found"));
        if (!room.isBookable()) throw new IllegalStateException("Room is not available for booking");
        if (in.isBefore(LocalDate.now())) throw new IllegalArgumentException("checkIn cannot be in the past");
        if (reservations.existsOverlap(roomId, in, out))
            throw new IllegalStateException("Room is not available for those dates");
        Guest saved = guests.findByEmail(guest.getEmail()).orElseGet(() -> guests.save(guest));
        return reservations.save(new Reservation(saved, room, in, out, numberOfGuests));
    }

    @Transactional
    public Reservation cancel(Long id) {
        Reservation r = get(id);
        r.cancel();
        return reservations.save(r);
    }
}
