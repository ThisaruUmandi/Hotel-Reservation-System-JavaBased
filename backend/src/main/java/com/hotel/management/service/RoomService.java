package com.hotel.management.service;

import com.hotel.management.exception.ResourceNotFoundException;
import com.hotel.management.exception.ForbiddenException;
import com.hotel.management.model.Role;
import com.hotel.management.model.Room;
import com.hotel.management.model.RoomStatus;
import com.hotel.management.security.AuthenticatedUser;
import com.hotel.management.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class RoomService {
    private final RoomRepository rooms;

    public RoomService(RoomRepository rooms) { this.rooms = rooms; }

    public List<Room> findAll() { return rooms.findAll(); }

    public Room get(Long id) {
        return rooms.findById(id).orElseThrow(() -> new ResourceNotFoundException("Room not found"));
    }

    /**
     * Staff can open or close a room; only administrators can change prices. Existing bookings keep the
     * price they were made at, and closing a room does not cancel bookings already made.
     */
    public Room update(Long id, BigDecimal price, RoomStatus status, AuthenticatedUser actor) {
        if (price != null && actor.role() != Role.ADMIN) throw new ForbiddenException("Only administrators can change prices");
        Room room = get(id);
        if (price != null) room.setPricePerNight(price);
        if (status != null) room.setStatus(status);
        return rooms.save(room);
    }

    /** Rooms that are open for booking, big enough for the party, and free on every night of the stay. */
    public List<Room> findAvailable(LocalDate checkIn, LocalDate checkOut, int guests, String typeName) {
        if (!checkOut.isAfter(checkIn)) throw new IllegalArgumentException("checkOut must be after checkIn");
        if (checkIn.isBefore(LocalDate.now())) throw new IllegalArgumentException("checkIn cannot be in the past");
        if (guests < 1) throw new IllegalArgumentException("At least 1 guest is required");
        return rooms.findAvailable(checkIn, checkOut, guests).stream()
                .filter(r -> typeName == null || typeName.isBlank()
                        || r.getRoomType().getName().equalsIgnoreCase(typeName))
                .toList();
    }
}
