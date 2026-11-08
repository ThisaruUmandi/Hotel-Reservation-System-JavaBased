package com.hotel.management.controller;

import com.hotel.management.model.User;
import com.hotel.management.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService users;
    public AuthController(UserService users) { this.users = users; }

    public record Credentials(String username, String password) {}

    @PostMapping("/register")
    public User register(@RequestBody Credentials c) { return users.register(c.username(), c.password()); }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Credentials c) {
        return users.login(c.username(), c.password())
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(Map.of("message", "Login successful", "username", u.getUsername())))
                .orElse(ResponseEntity.status(401).body(Map.of("error", "Invalid credentials")));
    }
}
