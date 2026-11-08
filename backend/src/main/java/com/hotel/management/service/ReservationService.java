package com.hotel.management.service;

import com.hotel.management.exception.ConflictException;
import com.hotel.management.exception.ResourceNotFoundException;
import com.hotel.management.model.*;
import com.hotel.management.repository.*;
import com.hotel.management.security.AuthenticatedUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ReservationService {
    private final ReservationRepository reservations;
    private final RoomRepository rooms;
    private final GuestRepository guests;
    private final PaymentRepository payments;
    private final UserRepository users;
    private final ReservationAccess access;

    public ReservationService(ReservationRepository reservations, RoomRepository rooms, GuestRepository guests,
                              PaymentRepository payments, UserRepository users, ReservationAccess access) {
        this.reservations = reservations; this.rooms = rooms; this.guests = guests;
        this.payments = payments; this.users = users; this.access = access;
    }

    /** Staff only (enforced in SecurityConfig). */
    public List<Reservation> findAll() { return reservations.findAll(); }

    public List<Reservation> findMine(AuthenticatedUser actor) {
        return users.findById(actor.id()).map(User::getGuest)
                .map(g -> reservations.findByGuestIdOrderByCheckInDesc(g.getId()))
                .orElse(List.of());
    }

    public Reservation get(Long id, AuthenticatedUser actor) { return access.load(id, actor); }

    @Transactional
    public Reservation create(AuthenticatedUser actor, Long roomId, Guest details, int numberOfGuests,
                              LocalDate in, LocalDate out) {
        Room room = rooms.findById(roomId).orElseThrow(() -> new ResourceNotFoundException("Room not found"));
        if (!room.isBookable()) throw new ConflictException("Room is not available for booking");
        if (in.isBefore(LocalDate.now())) throw new IllegalArgumentException("checkIn cannot be in the past");
        if (reservations.existsOverlap(roomId, in, out))
            throw new ConflictException("Room is not available for those dates");
        Guest guest = guestFor(actor, details);
        return reservations.save(new Reservation(guest, room, in, out, numberOfGuests));
    }

    /** A user keeps one guest profile; it is created from the first booking's details. */
    private Guest guestFor(AuthenticatedUser actor, Guest details) {
        User user = users.findById(actor.id()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getGuest() != null) return user.getGuest();
        Optional<Guest> existing = guests.findByEmail(details.getEmail());
        if (existing.isPresent() && users.existsByGuestId(existing.get().getId()))
            throw new ConflictException("That email is already linked to another account");
        Guest guest = existing.orElseGet(() -> guests.save(details));
        user.setGuest(guest);
        users.save(user);
        return guest;
    }

    @Transactional
    public Reservation cancel(Long id, AuthenticatedUser actor) {
        Reservation r = access.load(id, actor);
        r.cancel(LocalDate.now());
        // A cancelled booking gets its money back.
        payments.findByReservationId(id).stream()
                .filter(p -> p.getStatus() == PaymentStatus.PAID)
                .forEach(Payment::refund);
        return reservations.save(r);
    }
}
