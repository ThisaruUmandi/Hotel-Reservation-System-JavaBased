package com.hotel.management.dto;

import java.util.List;

public record RoomTypeResponse(Long id, String name, String description, int capacity, List<String> amenities) {}
