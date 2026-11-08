package com.hotel.management.dto;

import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank(message = "Username is required") @Size(min = 3, max = 30, message = "Username must be 3-30 characters") String username,
        @NotBlank(message = "Password is required") @Size(min = 8, max = 72, message = "Password must be at least 8 characters") String password) {}
