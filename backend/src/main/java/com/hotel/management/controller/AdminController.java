package com.hotel.management.controller;

import com.hotel.management.dto.*;
import com.hotel.management.mapper.EntityMapper;
import com.hotel.management.security.AuthenticatedUser;
import com.hotel.management.service.DashboardService;
import com.hotel.management.service.RoomService;
import com.hotel.management.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Back-office endpoints. Access rules live in SecurityConfig: staff and admins, with /users admin-only. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final DashboardService dashboard;
    private final RoomService rooms;
    private final UserService users;
    private final EntityMapper mapper;

    public AdminController(DashboardService dashboard, RoomService rooms, UserService users, EntityMapper mapper) {
        this.dashboard = dashboard; this.rooms = rooms; this.users = users; this.mapper = mapper;
    }

    @GetMapping("/summary")
    public AdminSummaryResponse summary() { return dashboard.summary(); }

    @PatchMapping("/rooms/{id}")
    public RoomResponse updateRoom(@PathVariable Long id, @Valid @RequestBody RoomUpdateRequest r,
                                   @AuthenticationPrincipal AuthenticatedUser actor) {
        return mapper.toResponse(rooms.update(id, r.pricePerNight(), r.status(), actor));
    }

    @GetMapping("/users")
    public List<UserResponse> users() { return users.findAll().stream().map(mapper::toResponse).toList(); }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@Valid @RequestBody CreateUserRequest r) {
        return mapper.toResponse(users.createPrivileged(r.username(), r.password(), r.role()));
    }

    @PatchMapping("/users/{id}")
    public UserResponse changeRole(@PathVariable Long id, @Valid @RequestBody RoleChangeRequest r,
                                   @AuthenticationPrincipal AuthenticatedUser actor) {
        return mapper.toResponse(users.changeRole(id, r.role(), actor.id()));
    }
}
