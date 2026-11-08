package com.hotel.management.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
public class Reservation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) private Customer customer;
    @ManyToOne(optional = false) private Room room;
    private LocalDate checkIn;
    private LocalDate checkOut;
    private BigDecimal totalPrice;
    private String status = "CONFIRMED";

    public Long getId() { return id; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer v) { this.customer = v; }
    public Room getRoom() { return room; }
    public void setRoom(Room v) { this.room = v; }
    public LocalDate getCheckIn() { return checkIn; }
    public void setCheckIn(LocalDate v) { this.checkIn = v; }
    public LocalDate getCheckOut() { return checkOut; }
    public void setCheckOut(LocalDate v) { this.checkOut = v; }
    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal v) { this.totalPrice = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }
}
