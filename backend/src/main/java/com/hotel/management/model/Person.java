package com.hotel.management.model;

import jakarta.persistence.*;

/** Abstract base for anyone we store contact details for. */
@MappedSuperclass
public abstract class Person {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private String email;
    private String phone;

    protected Person() {}
    protected Person(String name, String email, String phone) {
        this.name = name; this.email = email; this.phone = phone;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String v) { this.name = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }
    public String getPhone() { return phone; }
    public void setPhone(String v) { this.phone = v; }

    /** Each kind of person describes itself differently. */
    public abstract String getDisplayName();
}
