package com.hotel.management.security;

import com.hotel.management.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwt;
    private final UserRepository users;

    public JwtAuthFilter(JwtService jwt, UserRepository users) { this.jwt = jwt; this.users = users; }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            // The token only proves who the user is. Their role comes from the database, so a demoted or
            // deleted user loses access immediately instead of when the token expires.
            jwt.parse(header.substring(7)).flatMap(t -> users.findById(t.id())).ifPresent(u -> {
                AuthenticatedUser user = new AuthenticatedUser(u.getId(), u.getUsername(), u.getRole());
                SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.role().name()))));
            });
        }
        chain.doFilter(req, res);
    }
}
