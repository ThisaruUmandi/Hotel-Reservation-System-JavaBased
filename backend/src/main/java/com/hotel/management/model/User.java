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
    @Column(nullable = false)
    private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private Role role = Role.GUEST;
    @OneToOne
    private Guest guest;

    protected User() {}
    public User(String username, String passwordHash, Role role) {
        this.username = username; this.passwordHash = passwordHash; this.role = role;
    }

    public boolean isStaff() { return role == Role.STAFF || role == Role.ADMIN; }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; }
    public void setRole(Role v) { this.role = v; }
    public Guest getGuest() { return guest; }
    public void setGuest(Guest v) { this.guest = v; }
}
