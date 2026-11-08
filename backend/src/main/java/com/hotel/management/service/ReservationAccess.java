package com.hotel.management.service;

import com.hotel.management.exception.ResourceNotFoundException;
import com.hotel.management.model.Guest;
import com.hotel.management.model.Reservation;
import com.hotel.management.repository.ReservationRepository;
import com.hotel.management.repository.UserRepository;
import com.hotel.management.security.AuthenticatedUser;
import org.springframework.stereotype.Component;

/** Guests can only see and change their own reservations; staff can access all of them. */
@Component
public class ReservationAccess {
    private final ReservationRepository reservations;
    private final UserRepository users;

    public ReservationAccess(ReservationRepository reservations, UserRepository users) {
        this.reservations = reservations; this.users = users;
    }

    public Reservation load(Long id, AuthenticatedUser actor) {
        Reservation r = reservations.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
        if (actor.isStaff()) return r;
        Long guestId = users.findById(actor.id()).map(u -> u.getGuest()).map(Guest::getId).orElse(null);
        // Someone else's booking looks the same as one that does not exist.
        if (guestId == null || !guestId.equals(r.getGuest().getId()))
            throw new ResourceNotFoundException("Reservation not found");
        return r;
    }
}
