package com.hotel.management.model;

import jakarta.persistence.*;

@Entity
public class Customer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String email;
    private String phone;

    public Customer() {}
    public Customer(String name, String email, String phone) {
        this.name = name; this.email = email; this.phone = phone;
    }
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String v) { this.name = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }
    public String getPhone() { return phone; }
    public void setPhone(String v) { this.phone = v; }
}
