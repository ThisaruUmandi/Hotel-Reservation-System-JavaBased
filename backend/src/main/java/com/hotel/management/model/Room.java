package com.hotel.management.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
public class Room {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String roomNumber;
    private String type;
    private BigDecimal pricePerNight;

    public Room() {}
    public Room(String roomNumber, String type, BigDecimal pricePerNight) {
        this.roomNumber = roomNumber; this.type = type; this.pricePerNight = pricePerNight;
    }
    public Long getId() { return id; }
    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String v) { this.roomNumber = v; }
    public String getType() { return type; }
    public void setType(String v) { this.type = v; }
    public BigDecimal getPricePerNight() { return pricePerNight; }
    public void setPricePerNight(BigDecimal v) { this.pricePerNight = v; }
}
