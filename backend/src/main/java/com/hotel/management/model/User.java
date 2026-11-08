package com.hotel.management.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "app_user")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String username;
    @JsonIgnore
    private String passwordHash;
    private String role = "STAFF";

    public User() {}
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String v) { this.username = v; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String v) { this.passwordHash = v; }
    public String getRole() { return role; }
    public void setRole(String v) { this.role = v; }
}
