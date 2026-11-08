package com.hotel.management.api;

import com.hotel.management.model.*;
import com.hotel.management.repository.*;
import com.hotel.management.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/** Runs the real app (controllers, security, services, PostgreSQL). Each test is rolled back. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
abstract class ApiTestBase {
    @Autowired protected MockMvc mvc;
    @Autowired protected UserRepository users;
    @Autowired protected GuestRepository guests;
    @Autowired protected RoomRepository rooms;
    @Autowired protected ReservationRepository reservations;
    @Autowired protected PasswordEncoder encoder;
    @Autowired protected JwtService jwt;

    protected LocalDate in;
    protected LocalDate out;

    @BeforeEach
    void dates() {
        in = LocalDate.now().plusDays(40);
        out = in.plusDays(3);
    }

    protected User newUser(String username, Role role) {
        return users.save(new User(username, encoder.encode("password123"), role));
    }

    protected String bearer(User u) { return "Bearer " + jwt.generate(u); }

    protected Room room(String number) {
        return rooms.findAll().stream().filter(r -> r.getRoomNumber().equals(number)).findFirst().orElseThrow();
    }

    protected User userWithGuest(String username) {
        User u = newUser(username, Role.GUEST);
        u.setGuest(guests.save(new Guest(username, username + "@example.com", "0771234567")));
        return users.save(u);
    }

    protected String bookingJson(Long roomId, int guestsCount, LocalDate checkIn, LocalDate checkOut) {
        return """
               {"roomId":%d,"name":"Test Guest","email":"test@example.com","phone":"0771234567",
                "guests":%d,"checkIn":"%s","checkOut":"%s"}""".formatted(roomId, guestsCount, checkIn, checkOut);
    }
}
