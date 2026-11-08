package com.hotel.management.security;

import com.hotel.management.model.Role;

/** The logged-in user as read from a verified JWT. */
public record AuthenticatedUser(Long id, String username, Role role) {
    public boolean isStaff() { return role == Role.STAFF || role == Role.ADMIN; }
}
