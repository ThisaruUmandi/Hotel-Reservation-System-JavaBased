package com.hotel.management.service;

import com.hotel.management.exception.ConflictException;
import com.hotel.management.model.Role;
import com.hotel.management.model.User;
import com.hotel.management.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    private final UserRepository users;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public UserService(UserRepository users) { this.users = users; }

    public User register(String username, String password) {
        if (users.findByUsername(username).isPresent())
            throw new ConflictException("Username already taken");
        return users.save(new User(username, encoder.encode(password), Role.GUEST));
    }

    public Optional<User> login(String username, String password) {
        return users.findByUsername(username)
                .filter(u -> encoder.matches(password, u.getPasswordHash()));
    }
}
