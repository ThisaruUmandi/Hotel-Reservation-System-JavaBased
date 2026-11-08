package com.hotel.management.controller;

import com.hotel.management.dto.*;
import com.hotel.management.exception.ErrorResponse;
import com.hotel.management.mapper.EntityMapper;
import com.hotel.management.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService users;
    private final EntityMapper mapper;

    public AuthController(UserService users, EntityMapper mapper) { this.users = users; this.mapper = mapper; }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest r) {
        return mapper.toResponse(users.register(r.username(), r.password()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest c) {
        return users.login(c.username(), c.password())
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(mapper.toResponse(u)))
                .orElse(ResponseEntity.status(401).body(ErrorResponse.of(401, "Invalid credentials")));
    }
}
