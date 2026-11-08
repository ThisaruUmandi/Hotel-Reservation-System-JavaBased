package com.hotel.management.model;

import jakarta.persistence.*;

@Entity
@Table(name = "room_type")
public class RoomType {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String name;
    private String description;
    @Column(nullable = false)
    private int capacity;
    private String amenities;

    protected RoomType() {}
    public RoomType(String name, String description, int capacity, String amenities) {
        this.name = name; this.description = description;
        this.capacity = capacity; this.amenities = amenities;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public int getCapacity() { return capacity; }
    public String getAmenities() { return amenities; }
}
