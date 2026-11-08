package com.hotel.management.controller;

import com.hotel.management.dto.*;
import com.hotel.management.exception.ErrorResponse;
import com.hotel.management.exception.ResourceNotFoundException;
import com.hotel.management.mapper.EntityMapper;
import com.hotel.management.security.AuthenticatedUser;
import com.hotel.management.security.JwtService;
import com.hotel.management.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService users;
    private final JwtService jwt;
    private final EntityMapper mapper;

    public AuthController(UserService users, JwtService jwt, EntityMapper mapper) {
        this.users = users; this.jwt = jwt; this.mapper = mapper;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest r) {
        var user = users.register(r.username(), r.password());
        return new AuthResponse(jwt.generate(user), mapper.toResponse(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest c) {
        return users.login(c.username(), c.password())
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(new AuthResponse(jwt.generate(u), mapper.toResponse(u))))
                .orElse(ResponseEntity.status(401).body(ErrorResponse.of(401, "Invalid username or password")));
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody ChangePasswordRequest r, @AuthenticationPrincipal AuthenticatedUser actor) {
        users.changePassword(actor.id(), r.currentPassword(), r.newPassword());
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AuthenticatedUser actor) {
        return users.find(actor.id()).map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
