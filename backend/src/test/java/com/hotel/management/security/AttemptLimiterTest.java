package com.hotel.management.security;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class AttemptLimiterTest {
    private final AtomicReference<Instant> now = new AtomicReference<>(Instant.parse("2030-01-01T10:00:00Z"));
    private final AttemptLimiter limiter = new AttemptLimiter(3, Duration.ofMinutes(15), now::get);

    private void advance(Duration d) { now.set(now.get().plus(d)); }

    @Test
    void blocksOnlyAfterTheLimitIsReached() {
        limiter.recordFailure("amaya");
        limiter.recordFailure("amaya");
        assertFalse(limiter.isBlocked("amaya"));
        limiter.recordFailure("amaya");
        assertTrue(limiter.isBlocked("amaya"));
    }

    @Test
    void keysAreIndependent() {
        for (int i = 0; i < 3; i++) limiter.recordFailure("amaya");
        assertTrue(limiter.isBlocked("amaya"));
        assertFalse(limiter.isBlocked("nimal"));
    }

    @Test
    void theBlockLiftsWhenTheOldestFailureLeavesTheWindow() {
        limiter.recordFailure("amaya");
        advance(Duration.ofMinutes(5));
        limiter.recordFailure("amaya");
        limiter.recordFailure("amaya");
        assertEquals(Duration.ofMinutes(10), limiter.retryAfter("amaya"));
        advance(Duration.ofMinutes(10));
        assertFalse(limiter.isBlocked("amaya"));
    }

    @Test
    void aSuccessClearsTheCount() {
        limiter.recordFailure("amaya");
        limiter.recordFailure("amaya");
        limiter.reset("amaya");
        limiter.recordFailure("amaya");
        assertFalse(limiter.isBlocked("amaya"));
    }

    @Test
    void anUnknownKeyIsNeverBlocked() {
        assertEquals(Duration.ZERO, limiter.retryAfter("nobody"));
    }
}
