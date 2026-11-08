package com.hotel.management.service;

import com.hotel.management.model.*;
import com.hotel.management.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ReservationService {
    private final ReservationRepository reservations;
    private final RoomRepository rooms;
    private final CustomerRepository customers;

    public ReservationService(ReservationRepository r, RoomRepository rooms, CustomerRepository c) {
        this.reservations = r; this.rooms = rooms; this.customers = c;
    }

    public List<Reservation> findAll() { return reservations.findAll(); }

    public Reservation get(Long id) {
        return reservations.findById(id).orElseThrow(() -> new NoSuchElementException("Reservation not found"));
    }

    @Transactional
    public Reservation create(Long roomId, Customer customer, LocalDate in, LocalDate out) {
        if (!out.isAfter(in)) throw new IllegalArgumentException("checkOut must be after checkIn");
        Room room = rooms.findById(roomId).orElseThrow(() -> new NoSuchElementException("Room not found"));
        if (reservations.existsOverlap(roomId, in, out))
            throw new IllegalStateException("Room is not available for those dates");
        Reservation r = new Reservation();
        r.setRoom(room);
        r.setCustomer(customers.save(customer));
        r.setCheckIn(in);
        r.setCheckOut(out);
        r.setTotalPrice(room.getPricePerNight().multiply(BigDecimal.valueOf(ChronoUnit.DAYS.between(in, out))));
        return reservations.save(r);
    }

    public Reservation cancel(Long id) {
        Reservation r = get(id);
        r.setStatus("CANCELLED");
        return reservations.save(r);
    }
}
