package com.hotel.management.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
public class Room {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String roomNumber;
    @ManyToOne(optional = false)
    private RoomType roomType;
    @Column(nullable = false)
    private BigDecimal pricePerNight;
    private int floor = 1;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private RoomStatus status = RoomStatus.AVAILABLE;
    private String imageUrl;

    protected Room() {}
    public Room(String roomNumber, RoomType roomType, BigDecimal pricePerNight) {
        this.roomNumber = roomNumber; this.roomType = roomType; this.pricePerNight = pricePerNight;
    }

    public boolean canHost(int guests) { return guests <= roomType.getCapacity(); }
    public boolean isBookable() { return status == RoomStatus.AVAILABLE; }
    public BigDecimal priceFor(long nights) { return pricePerNight.multiply(BigDecimal.valueOf(nights)); }

    public Long getId() { return id; }
    public String getRoomNumber() { return roomNumber; }
    public RoomType getRoomType() { return roomType; }
    public BigDecimal getPricePerNight() { return pricePerNight; }
    public void setPricePerNight(BigDecimal v) { this.pricePerNight = v; }
    public int getFloor() { return floor; }
    public void setFloor(int v) { this.floor = v; }
    public RoomStatus getStatus() { return status; }
    public void setStatus(RoomStatus v) { this.status = v; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String v) { this.imageUrl = v; }
}
