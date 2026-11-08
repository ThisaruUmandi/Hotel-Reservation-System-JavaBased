package com.hotel.management.controller;

import com.hotel.management.dto.BookingRequest;
import com.hotel.management.dto.ReservationResponse;
import com.hotel.management.mapper.EntityMapper;
import com.hotel.management.model.Guest;
import com.hotel.management.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {
    private final ReservationService service;
    private final EntityMapper mapper;

    public ReservationController(ReservationService service, EntityMapper mapper) {
        this.service = service; this.mapper = mapper;
    }

    @GetMapping
    public List<ReservationResponse> all() { return service.findAll().stream().map(mapper::toResponse).toList(); }

    @GetMapping("/{id}")
    public ReservationResponse one(@PathVariable Long id) { return mapper.toResponse(service.get(id)); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse create(@Valid @RequestBody BookingRequest b) {
        Guest guest = new Guest(b.name(), b.email(), b.phone());
        return mapper.toResponse(service.create(b.roomId(), guest, b.guests(), b.checkIn(), b.checkOut()));
    }

    @DeleteMapping("/{id}")
    public ReservationResponse cancel(@PathVariable Long id) { return mapper.toResponse(service.cancel(id)); }
}
