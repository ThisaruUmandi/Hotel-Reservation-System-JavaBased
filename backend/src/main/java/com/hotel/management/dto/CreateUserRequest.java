package com.hotel.management.dto;

import com.hotel.management.model.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank(message = "Username is required") @Size(min = 3, max = 30, message = "Username must be 3-30 characters") String username,
        @NotBlank(message = "Password is required") @Size(min = 8, max = 72, message = "Password must be at least 8 characters") String password,
        @NotNull(message = "Role is required") Role role) {}
