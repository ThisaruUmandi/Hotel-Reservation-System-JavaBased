package com.hotel.management.security;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/**
 * Counts failures per key (a username or an address) inside a sliding window. Once a key has
 * failed {@code maxFailures} times, it is blocked until the oldest failure falls out of the window.
 * Kept in memory, which is enough for a single server.
 */
public class AttemptLimiter {
    private final int maxFailures;
    private final Duration window;
    private final Supplier<Instant> clock;
    private final Map<String, Deque<Instant>> failures = new ConcurrentHashMap<>();

    public AttemptLimiter(int maxFailures, Duration window) { this(maxFailures, window, Instant::now); }

    public AttemptLimiter(int maxFailures, Duration window, Supplier<Instant> clock) {
        this.maxFailures = maxFailures; this.window = window; this.clock = clock;
    }

    public boolean isBlocked(String key) { return retryAfter(key).compareTo(Duration.ZERO) > 0; }

    /** How long until the key may try again; zero when it is not blocked. */
    public Duration retryAfter(String key) {
        Deque<Instant> recent = failures.get(key);
        if (recent == null) return Duration.ZERO;
        synchronized (recent) {
            prune(recent);
            if (recent.size() < maxFailures) return Duration.ZERO;
            return Duration.between(clock.get(), recent.peekFirst().plus(window));
        }
    }

    public void recordFailure(String key) {
        Deque<Instant> recent = failures.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (recent) { prune(recent); recent.addLast(clock.get()); }
        if (failures.size() > 10_000) failures.entrySet().removeIf(e -> { synchronized (e.getValue()) { prune(e.getValue()); return e.getValue().isEmpty(); } });
    }

    public void reset(String key) { failures.remove(key); }

    public void clear() { failures.clear(); }

    private void prune(Deque<Instant> recent) {
        Instant cutoff = clock.get().minus(window);
        while (!recent.isEmpty() && !recent.peekFirst().isAfter(cutoff)) recent.pollFirst();
    }
}
