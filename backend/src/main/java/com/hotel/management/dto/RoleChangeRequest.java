package com.hotel.management.dto;

import com.hotel.management.model.Role;
import jakarta.validation.constraints.NotNull;

public record RoleChangeRequest(@NotNull(message = "Role is required") Role role) {}
