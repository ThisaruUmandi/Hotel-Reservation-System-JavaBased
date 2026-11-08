package com.hotel.management.security;

import com.hotel.management.model.Role;
import com.hotel.management.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {
    private static final String SECRET = "unit-test-secret-unit-test-secret-1234";
    private final JwtService jwt = new JwtService(SECRET, 12);

    private User user(Role role) {
        User u = new User("alice", "hash", role);
        ReflectionTestUtils.setField(u, "id", 7L);
        return u;
    }

    @Test
    void roundTripKeepsIdentityAndRole() {
        var parsed = jwt.parse(jwt.generate(user(Role.STAFF))).orElseThrow();
        assertEquals(7L, parsed.id());
        assertEquals("alice", parsed.username());
        assertEquals(Role.STAFF, parsed.role());
        assertTrue(parsed.isStaff());
    }

    @Test
    void tamperedTokenIsRejected() {
        String token = jwt.generate(user(Role.GUEST));
        String tampered = token.substring(0, token.length() - 2) + (token.endsWith("AA") ? "BB" : "AA");
        assertTrue(jwt.parse(tampered).isEmpty());
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() {
        JwtService other = new JwtService("another-secret-another-secret-12345678", 12);
        assertTrue(jwt.parse(other.generate(user(Role.ADMIN))).isEmpty());
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService instant = new JwtService(SECRET, 0);
        assertTrue(instant.parse(instant.generate(user(Role.GUEST))).isEmpty());
    }

    @Test
    void garbageIsRejected() {
        assertTrue(jwt.parse("not-a-token").isEmpty());
        assertTrue(jwt.parse("").isEmpty());
    }

    @Test
    void shortSecretIsRefused() {
        assertThrows(IllegalStateException.class, () -> new JwtService("too-short", 12));
    }

    @Test
    void guestIsNotStaff() {
        assertFalse(jwt.parse(jwt.generate(user(Role.GUEST))).orElseThrow().isStaff());
    }
}
