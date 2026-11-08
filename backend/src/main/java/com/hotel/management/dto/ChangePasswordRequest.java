package com.hotel.management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Enter your current password") String currentPassword,
        @NotBlank(message = "Enter a new password") @Size(min = 8, max = 72, message = "Password must be at least 8 characters") String newPassword) {}
