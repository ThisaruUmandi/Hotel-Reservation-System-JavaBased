package com.hotel.management.service;

import com.hotel.management.exception.ResourceNotFoundException;
import com.hotel.management.model.Room;
import com.hotel.management.repository.RoomRepository;
import org.springframework.stereotype.Service;

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
