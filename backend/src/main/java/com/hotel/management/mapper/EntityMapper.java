package com.hotel.management.mapper;

import com.hotel.management.dto.*;
import com.hotel.management.model.*;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/** Converts entities to response DTOs so the API never exposes the persistence model directly. */
@Component
public class EntityMapper {

    public RoomTypeResponse toResponse(RoomType t) {
        List<String> amenities = t.getAmenities() == null || t.getAmenities().isBlank()
                ? List.of() : Arrays.stream(t.getAmenities().split(",")).map(String::trim).toList();
        return new RoomTypeResponse(t.getId(), t.getName(), t.getDescription(), t.getCapacity(), amenities);
    }

    public RoomResponse toResponse(Room r) {
        return new RoomResponse(r.getId(), r.getRoomNumber(), toResponse(r.getRoomType()), r.getPricePerNight(),
                r.getFloor(), r.getStatus().name(), r.getImageUrl());
    }

    public GuestResponse toResponse(Guest g) {
        return new GuestResponse(g.getId(), g.getName(), g.getEmail(), g.getPhone());
    }

    public ReservationResponse toResponse(Reservation r, boolean reviewed) {
        return new ReservationResponse(r.getId(), toResponse(r.getGuest()), toResponse(r.getRoom()),
                r.getCheckIn(), r.getCheckOut(), r.nights(), r.getNumberOfGuests(), r.getTotalPrice(),
                r.getStatus().name(), reviewed, r.getCreatedAt());
    }

    public UserResponse toResponse(User u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getRole().name(),
                u.getGuest() == null ? null : toResponse(u.getGuest()));
    }

    public PaymentResponse toResponse(Payment p) {
        return new PaymentResponse(p.getId(), p.getReservation().getId(), p.getMethod().name(), p.describe(),
                p.getAmount(), p.getStatus().name(), p.getPaidAt());
    }

    public ReviewResponse toResponse(Review r) {
        return new ReviewResponse(r.getId(), publicName(r.getGuest().getName()), r.getRating(), r.getComment(), r.getCreatedAt());
    }

    /** Reviews are public, so show "Nadia P." rather than a full name. */
    static String publicName(String fullName) {
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length < 2) return parts[0];
        return parts[0] + " " + Character.toUpperCase(parts[parts.length - 1].charAt(0)) + ".";
    }
}
