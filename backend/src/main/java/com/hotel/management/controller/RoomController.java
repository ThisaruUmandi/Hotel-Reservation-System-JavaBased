package com.hotel.management.controller;

import com.hotel.management.dto.*;
import com.hotel.management.mapper.EntityMapper;
import com.hotel.management.service.ReviewService;
import com.hotel.management.service.RoomService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {
    private final RoomService service;
    private final ReviewService reviews;
    private final EntityMapper mapper;

    public RoomController(RoomService service, ReviewService reviews, EntityMapper mapper) {
        this.service = service; this.reviews = reviews; this.mapper = mapper;
    }

    @GetMapping
    public List<RoomResponse> all() { return service.findAll().stream().map(mapper::toResponse).toList(); }

    @GetMapping("/available")
    public List<RoomResponse> available(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
            @RequestParam(defaultValue = "1") int guests,
            @RequestParam(required = false) String type) {
        return service.findAvailable(checkIn, checkOut, guests, type).stream().map(mapper::toResponse).toList();
    }

    @GetMapping("/{id}")
    public RoomResponse one(@PathVariable Long id) { return mapper.toResponse(service.get(id)); }

    @GetMapping("/{id}/reviews")
    public RoomReviewsResponse reviewsFor(@PathVariable Long id) {
        var list = reviews.forRoom(id);
        double avg = list.stream().mapToInt(r -> r.getRating()).average().orElse(0);
        return new RoomReviewsResponse(Math.round(avg * 10) / 10.0, list.size(),
                list.stream().map(mapper::toResponse).toList());
    }
}
