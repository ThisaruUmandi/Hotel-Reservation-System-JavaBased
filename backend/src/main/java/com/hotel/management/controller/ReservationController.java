package com.hotel.management.controller;

import com.hotel.management.dto.BookingRequest;
import com.hotel.management.dto.ReservationResponse;
import com.hotel.management.mapper.EntityMapper;
import com.hotel.management.model.Guest;
import com.hotel.management.security.AuthenticatedUser;
import com.hotel.management.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    /** All reservations: staff and admin only. */
    @GetMapping
    public List<ReservationResponse> all() { return withReviewFlags(service.findAll()); }

    @GetMapping("/mine")
    public List<ReservationResponse> mine(@AuthenticationPrincipal AuthenticatedUser actor) {
        return withReviewFlags(service.findMine(actor));
    }

    @GetMapping("/{id}")
    public ReservationResponse one(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser actor) {
        var reservation = service.get(id, actor);
        return mapper.toResponse(reservation, service.isReviewed(reservation.getId()), service.isPaid(reservation.getId()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse create(@Valid @RequestBody BookingRequest b,
                                      @AuthenticationPrincipal AuthenticatedUser actor) {
        Guest details = new Guest(b.name(), b.email(), b.phone());
        return mapper.toResponse(service.create(actor, b.roomId(), details, b.guests(), b.checkIn(), b.checkOut()), false, false);
    }

    @DeleteMapping("/{id}")
    public ReservationResponse cancel(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser actor) {
        return mapper.toResponse(service.cancel(id, actor), false, false); // a cancelled stay is neither reviewed nor paid (it is refunded)
    }

    private List<ReservationResponse> withReviewFlags(List<com.hotel.management.model.Reservation> list) {
        var reviewed = service.reviewedIds(list);
        var paid = service.paidIds(list);
        return list.stream().map(r -> mapper.toResponse(r, reviewed.contains(r.getId()), paid.contains(r.getId()))).toList();
    }
}
