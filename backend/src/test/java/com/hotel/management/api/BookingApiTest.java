package com.hotel.management.api;

import com.hotel.management.model.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class BookingApiTest extends ApiTestBase {

    private String book(User u, Room r, int n, LocalDate a, LocalDate b, int expectedStatus) throws Exception {
        return mvc.perform(post("/api/reservations").header("Authorization", bearer(u))
                        .contentType(MediaType.APPLICATION_JSON).content(bookingJson(r.getId(), n, a, b)))
                .andExpect(status().is(expectedStatus)).andReturn().getResponse().getContentAsString();
    }

    @Test
    void bookingComputesNightsAndTotal() throws Exception {
        User alice = newUser("alice", Role.GUEST);
        mvc.perform(post("/api/reservations").header("Authorization", bearer(alice))
                        .contentType(MediaType.APPLICATION_JSON).content(bookingJson(room("102").getId(), 2, in, out)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nights").value(3))
                .andExpect(jsonPath("$.totalPrice").value(room("102").getPricePerNight().multiply(java.math.BigDecimal.valueOf(3)).doubleValue()))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    void overlappingBookingIsRejectedButAdjacentIsAllowed() throws Exception {
        User alice = newUser("alice", Role.GUEST);
        book(alice, room("102"), 2, in, out, 201);
        book(alice, room("102"), 1, in.plusDays(1), out.plusDays(1), 409);
        book(alice, room("102"), 1, out, out.plusDays(2), 201);   // starts the day the first one ends
    }

    @Test
    void invalidBookingsAreRejected() throws Exception {
        User alice = newUser("alice", Role.GUEST);
        book(alice, room("101"), 3, in, out, 400);                       // single room, 3 guests
        book(alice, room("102"), 1, out, in, 400);                       // check-out before check-in
        book(alice, room("102"), 1, LocalDate.now().minusDays(1), in, 400); // past check-in
        mvc.perform(post("/api/reservations").header("Authorization", bearer(alice))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\",\"email\":\"bad\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.roomId").exists());
    }

    @Test
    void unknownRoomIs404() throws Exception {
        mvc.perform(post("/api/reservations").header("Authorization", bearer(newUser("alice", Role.GUEST)))
                        .contentType(MediaType.APPLICATION_JSON).content(bookingJson(999999L, 1, in, out)))
                .andExpect(status().isNotFound());
    }

    @Test
    void maintenanceRoomCannotBeBooked() throws Exception {
        Room r = room("201");
        r.setStatus(RoomStatus.MAINTENANCE);
        rooms.save(r);
        book(newUser("alice", Role.GUEST), r, 1, in, out, 409);
    }

    @Test
    void availabilitySearchExcludesBookedAndTooSmallRooms() throws Exception {
        book(newUser("alice", Role.GUEST), room("102"), 2, in, out, 201);
        mvc.perform(get("/api/rooms/available").param("checkIn", in.toString())
                        .param("checkOut", out.toString()).param("guests", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].roomNumber", hasItem("201")))
                .andExpect(jsonPath("$[*].roomNumber", not(hasItem("102"))))   // booked
                .andExpect(jsonPath("$[*].roomNumber", not(hasItem("101")))); // capacity 1
        mvc.perform(get("/api/rooms/available").param("checkIn", in.toString())
                        .param("checkOut", out.toString()).param("type", "suite"))
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void availabilitySearchValidatesInput() throws Exception {
        mvc.perform(get("/api/rooms/available").param("checkIn", out.toString()).param("checkOut", in.toString()))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/rooms/available")).andExpect(status().isBadRequest());
    }

    @Test
    void cancellingFreesTheRoomAndRefundsPayment() throws Exception {
        User alice = newUser("alice", Role.GUEST);
        String json = book(alice, room("102"), 2, in, out, 201);
        long id = ((Number) com.jayway.jsonpath.JsonPath.read(json, "$.id")).longValue();

        mvc.perform(post("/api/payments").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reservationId\":" + id + ",\"method\":\"CARD\",\"cardNumber\":\"4242 4242 4242 4242\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.description").value("Visa ending 4242"))
                .andExpect(content().string(not(containsString("4242 4242 4242"))));   // full number never returned

        mvc.perform(delete("/api/reservations/" + id).header("Authorization", bearer(alice)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED"));
        mvc.perform(get("/api/reservations/" + id + "/payments").header("Authorization", bearer(alice)))
                .andExpect(jsonPath("$[0].status").value("REFUNDED"));

        book(alice, room("102"), 2, in, out, 201);   // the room is free again
    }

    @Test
    void startedStayCannotBeCancelled() throws Exception {
        User alice = userWithGuest("alice");
        Reservation started = reservations.save(new Reservation(alice.getGuest(), room("102"),
                LocalDate.now(), LocalDate.now().plusDays(2), 1));
        mvc.perform(delete("/api/reservations/" + started.getId()).header("Authorization", bearer(alice)))
                .andExpect(status().isConflict());
    }

    @Test
    void paymentRules() throws Exception {
        User alice = newUser("alice", Role.GUEST);
        long id = ((Number) com.jayway.jsonpath.JsonPath.read(book(alice, room("102"), 2, in, out, 201), "$.id")).longValue();
        String card = "{\"reservationId\":" + id + ",\"method\":\"CARD\",\"cardNumber\":\"5555555555554444\"}";

        mvc.perform(post("/api/payments").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\":" + id + ",\"method\":\"CARD\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/payments").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                .content(card)).andExpect(status().isCreated()).andExpect(jsonPath("$.description").value("Mastercard ending 4444"));
        mvc.perform(post("/api/payments").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                .content(card)).andExpect(status().isConflict());   // already paid
    }

    @Test
    void reviewRules() throws Exception {
        User alice = userWithGuest("alice");
        Room r = room("201");
        Reservation upcoming = reservations.save(new Reservation(alice.getGuest(), r, in, out, 1));
        Reservation finished = reservations.save(new Reservation(alice.getGuest(), r,
                LocalDate.now().minusDays(5), LocalDate.now().minusDays(2), 1));

        String body = "{\"reservationId\":%d,\"rating\":%d,\"comment\":\"Lovely\"}";
        mvc.perform(post("/api/reviews").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                .content(body.formatted(upcoming.getId(), 5))).andExpect(status().isConflict());        // stay not finished
        mvc.perform(post("/api/reviews").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                .content(body.formatted(finished.getId(), 9))).andExpect(status().isBadRequest());       // bad rating
        mvc.perform(post("/api/reviews").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                .content(body.formatted(finished.getId(), 4))).andExpect(status().isCreated());
        mvc.perform(post("/api/reviews").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                .content(body.formatted(finished.getId(), 5))).andExpect(status().isConflict());         // only once

        mvc.perform(get("/api/rooms/" + r.getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.averageRating").value(4.0));
    }

    @Test
    void reservationsReportWhetherTheyHaveBeenReviewed() throws Exception {
        User alice = userWithGuest("alice");
        Room r = room("201");
        Reservation finished = reservations.save(new Reservation(alice.getGuest(), r,
                LocalDate.now().minusDays(5), LocalDate.now().minusDays(2), 1));

        mvc.perform(get("/api/reservations/" + finished.getId()).header("Authorization", bearer(alice)))
                .andExpect(jsonPath("$.reviewed").value(false));
        mvc.perform(post("/api/reviews").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\":" + finished.getId() + ",\"rating\":5,\"comment\":\"Lovely\"}")).andExpect(status().isCreated());
        mvc.perform(get("/api/reservations/" + finished.getId()).header("Authorization", bearer(alice)))
                .andExpect(jsonPath("$.reviewed").value(true));
        mvc.perform(get("/api/reservations/mine").header("Authorization", bearer(alice)))
                .andExpect(jsonPath("$[0].reviewed").value(true));
    }

    @Test
    void ratesAreInRupees() throws Exception {
        // Seed rates from migration V4. A night in the cheapest room should be a plausible LKR amount.
        mvc.perform(get("/api/rooms/" + room("101").getId()))
                .andExpect(jsonPath("$.pricePerNight").value(12000.0));
    }

    @Test
    void publicReviewsShowOnlyFirstNameAndInitial() throws Exception {
        User dana = newUser("dana", Role.GUEST);
        dana.setGuest(guests.save(new Guest("Dana Wickramasinghe", "dana@example.com", null)));
        users.save(dana);
        Reservation finished = reservations.save(new Reservation(dana.getGuest(), room("201"),
                LocalDate.now().minusDays(5), LocalDate.now().minusDays(2), 1));
        mvc.perform(post("/api/reviews").header("Authorization", bearer(dana)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\":" + finished.getId() + ",\"rating\":5,\"comment\":\"Great\"}")).andExpect(status().isCreated())
                .andExpect(jsonPath("$.guestName").value("Dana W."));
        mvc.perform(get("/api/rooms/" + room("201").getId() + "/reviews"))
                .andExpect(jsonPath("$.reviews[0].guestName").value("Dana W."));
    }
}
