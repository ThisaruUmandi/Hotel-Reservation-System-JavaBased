package com.hotel.management.security;

import com.hotel.management.model.Role;
import com.hotel.management.model.User;
import com.hotel.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Creates the first admin from ADMIN_USERNAME / ADMIN_PASSWORD if it does not exist yet. */
@Component
public class AdminSeeder implements ApplicationRunner {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String username;
    private final String password;

    public AdminSeeder(UserRepository users, PasswordEncoder encoder,
                       @Value("${app.admin.username}") String username,
                       @Value("${app.admin.password}") String password) {
        this.users = users; this.encoder = encoder; this.username = username; this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (username.isBlank() || password.length() < 8) return;
        if (users.findByUsername(username).isEmpty())
            users.save(new User(username, encoder.encode(password), Role.ADMIN));
    }
}
