package com.hotel.management.controller;

import com.hotel.management.dto.ReviewRequest;
import com.hotel.management.dto.ReviewResponse;
import com.hotel.management.mapper.EntityMapper;
import com.hotel.management.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    private final ReviewService service;
    private final EntityMapper mapper;

    public ReviewController(ReviewService service, EntityMapper mapper) { this.service = service; this.mapper = mapper; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse add(@Valid @RequestBody ReviewRequest req) { return mapper.toResponse(service.add(req)); }
}
