package com.hotel.management.repository;

import com.hotel.management.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {}
