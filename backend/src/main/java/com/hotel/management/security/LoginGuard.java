package com.hotel.management.security;

import com.hotel.management.exception.TooManyAttemptsException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Locale;

/**
 * Slows down password guessing. A username is blocked after a handful of wrong passwords, and an
 * address after more of them, so one attacker cannot try many accounts either.
 */
@Component
public class LoginGuard {
    private final AttemptLimiter byUsername;
    private final AttemptLimiter byAddress;

    public LoginGuard(@Value("${app.security.login-max-failures-per-user:5}") int perUser,
                      @Value("${app.security.login-max-failures-per-address:30}") int perAddress,
                      @Value("${app.security.login-window-minutes:15}") int windowMinutes) {
        Duration window = Duration.ofMinutes(windowMinutes);
        this.byUsername = new AttemptLimiter(perUser, window);
        this.byAddress = new AttemptLimiter(perAddress, window);
    }

    private static String key(String username) { return username.trim().toLowerCase(Locale.ROOT); }

    /** Call before checking the password. Throws if this username or address is locked out. */
    public void check(String username, String address) {
        Duration wait = byUsername.retryAfter(key(username)).compareTo(byAddress.retryAfter(address)) >= 0
                ? byUsername.retryAfter(key(username)) : byAddress.retryAfter(address);
        if (wait.toMillis() > 0) throw new TooManyAttemptsException(wait);
    }

    public void failed(String username, String address) {
        byUsername.recordFailure(key(username));
        byAddress.recordFailure(address);
    }

    public void succeeded(String username) { byUsername.reset(key(username)); }

    public void clear() { byUsername.clear(); byAddress.clear(); }
}
