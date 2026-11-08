package com.hotel.management.controller;

import com.hotel.management.dto.RoomResponse;
import com.hotel.management.mapper.EntityMapper;
import com.hotel.management.service.RoomService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {
    private final RoomService service;
    private final EntityMapper mapper;

    public RoomController(RoomService service, EntityMapper mapper) { this.service = service; this.mapper = mapper; }

    @GetMapping
    public List<RoomResponse> all() { return service.findAll().stream().map(mapper::toResponse).toList(); }

    @GetMapping("/{id}")
    public RoomResponse one(@PathVariable Long id) { return mapper.toResponse(service.get(id)); }
}
