package com.hotel.management.service;

import com.hotel.management.exception.ConflictException;
import com.hotel.management.model.Role;
import com.hotel.management.model.User;
import com.hotel.management.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    private final UserRepository users;
    private final PasswordEncoder encoder;

    public UserService(UserRepository users, PasswordEncoder encoder) {
        this.users = users; this.encoder = encoder;
    }

    public User register(String username, String password) {
        if (users.findByUsername(username).isPresent())
            throw new ConflictException("Username already taken");
        return users.save(new User(username, encoder.encode(password), Role.GUEST));
    }

    public Optional<User> login(String username, String password) {
        return users.findByUsername(username)
                .filter(u -> encoder.matches(password, u.getPasswordHash()));
    }

    public List<User> findAll() { return users.findAll(); }

    /** Admins create staff accounts. Guests register themselves, so only STAFF or ADMIN is allowed here. */
    public User createPrivileged(String username, String password, Role role) {
        if (role == Role.GUEST) throw new IllegalArgumentException("Guests register themselves. Choose STAFF or ADMIN.");
        if (users.findByUsername(username).isPresent()) throw new ConflictException("Username already taken");
        return users.save(new User(username, encoder.encode(password), role));
    }

    public User changeRole(Long id, Role role, Long actorId) {
        if (id.equals(actorId)) throw new IllegalArgumentException("You cannot change your own role");
        User user = users.findById(id).orElseThrow(() -> new com.hotel.management.exception.ResourceNotFoundException("User not found"));
        user.setRole(role);
        return users.save(user);
    }

    public Optional<User> find(Long id) { return users.findById(id); }

    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = users.findById(userId).orElseThrow(() -> new com.hotel.management.exception.ResourceNotFoundException("User not found"));
        if (!encoder.matches(currentPassword, user.getPasswordHash()))
            throw new IllegalArgumentException("Your current password is not correct");
        user.setPasswordHash(encoder.encode(newPassword));
        users.save(user);
    }
}
