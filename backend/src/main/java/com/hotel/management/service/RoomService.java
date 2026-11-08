package com.hotel.management.service;

import com.hotel.management.exception.ResourceNotFoundException;
import com.hotel.management.model.Room;
import com.hotel.management.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoomService {
    private final RoomRepository rooms;

    public RoomService(RoomRepository rooms) { this.rooms = rooms; }

    public List<Room> findAll() { return rooms.findAll(); }

    public Room get(Long id) {
        return rooms.findById(id).orElseThrow(() -> new ResourceNotFoundException("Room not found"));
    }
}
