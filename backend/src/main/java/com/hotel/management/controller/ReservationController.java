package com.hotel.management.controller;

import com.hotel.management.model.*;
import com.hotel.management.repository.RoomRepository;
import com.hotel.management.service.ReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api")
public class ReservationController {
    private final ReservationService service;
    private final RoomRepository rooms;

    public ReservationController(ReservationService service, RoomRepository rooms) {
        this.service = service; this.rooms = rooms;
    }

    public record BookingRequest(Long roomId, String name, String email, String phone,
                                 Integer guests, LocalDate checkIn, LocalDate checkOut) {}

    @GetMapping("/rooms")
    public List<Room> rooms() { return rooms.findAll(); }

    @GetMapping("/reservations")
    public List<Reservation> all() { return service.findAll(); }

    @GetMapping("/reservations/{id}")
    public Reservation one(@PathVariable Long id) { return service.get(id); }

    @PostMapping("/reservations")
    @ResponseStatus(HttpStatus.CREATED)
    public Reservation create(@RequestBody BookingRequest b) {
        return service.create(b.roomId(), new Guest(b.name(), b.email(), b.phone()),
                b.guests() == null ? 1 : b.guests(), b.checkIn(), b.checkOut());
    }

    @DeleteMapping("/reservations/{id}")
    public Reservation cancel(@PathVariable Long id) { return service.cancel(id); }

    @ExceptionHandler(NoSuchElementException.class)
    ResponseEntity<?> notFound(Exception e) { return ResponseEntity.status(404).body(Map.of("error", e.getMessage())); }

    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<?> conflict(Exception e) { return ResponseEntity.status(409).body(Map.of("error", e.getMessage())); }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<?> bad(Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
}
