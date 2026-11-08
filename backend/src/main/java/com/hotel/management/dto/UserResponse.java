package com.hotel.management.dto;

/** `guest` is the saved contact profile; it is null until the user's first booking. */
public record UserResponse(Long id, String username, String role, GuestResponse guest) {}
