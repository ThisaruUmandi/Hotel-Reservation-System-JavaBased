package com.hotel.management.model;

import jakarta.persistence.Entity;

@Entity
public class Guest extends Person {
    protected Guest() {}
    public Guest(String name, String email, String phone) { super(name, email, phone); }

    @Override
    public String getDisplayName() { return getName(); }
}
