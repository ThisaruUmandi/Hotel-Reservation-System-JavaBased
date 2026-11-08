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

    public ReservationResponse toResponse(Reservation r) {
        return new ReservationResponse(r.getId(), toResponse(r.getGuest()), toResponse(r.getRoom()),
                r.getCheckIn(), r.getCheckOut(), r.nights(), r.getNumberOfGuests(), r.getTotalPrice(),
                r.getStatus().name(), r.getCreatedAt());
    }

    public UserResponse toResponse(User u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getRole().name());
    }
}
