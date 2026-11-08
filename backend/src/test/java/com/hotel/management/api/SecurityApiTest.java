package com.hotel.management.api;

import com.hotel.management.model.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SecurityApiTest extends ApiTestBase {

    private Reservation reservationOf(User owner) {
        return reservations.save(new Reservation(owner.getGuest(), room("102"), in, out, 2));
    }

    @Test
    void publicEndpointsNeedNoLogin() throws Exception {
        mvc.perform(get("/api/rooms")).andExpect(status().isOk());
        mvc.perform(get("/api/rooms/" + room("101").getId())).andExpect(status().isOk());
    }

    @Test
    void protectedEndpointsRequireLogin() throws Exception {
        mvc.perform(get("/api/reservations/mine")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/reservations").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/reservations/mine").header("Authorization", "Bearer garbage"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void onlyStaffCanListEveryReservation() throws Exception {
        mvc.perform(get("/api/reservations").header("Authorization", bearer(newUser("alice", Role.GUEST))))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/reservations").header("Authorization", bearer(newUser("sam", Role.STAFF))))
                .andExpect(status().isOk());
        mvc.perform(get("/api/reservations").header("Authorization", bearer(newUser("root", Role.ADMIN))))
                .andExpect(status().isOk());
    }

    @Test
    void guestsCannotSeeOrChangeOthersReservations() throws Exception {
        User alice = userWithGuest("alice");
        User bob = userWithGuest("bob");
        Reservation r = reservationOf(alice);

        mvc.perform(get("/api/reservations/" + r.getId()).header("Authorization", bearer(bob))).andExpect(status().isNotFound());
        mvc.perform(delete("/api/reservations/" + r.getId()).header("Authorization", bearer(bob))).andExpect(status().isNotFound());
        mvc.perform(get("/api/reservations/" + r.getId() + "/payments").header("Authorization", bearer(bob))).andExpect(status().isNotFound());
        mvc.perform(post("/api/payments").header("Authorization", bearer(bob)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\":" + r.getId() + ",\"method\":\"CARD\",\"cardNumber\":\"4242424242424242\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/reservations/mine").header("Authorization", bearer(bob)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/reservations/mine").header("Authorization", bearer(alice)))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void staffCanAccessAnyReservationAndTakeCash() throws Exception {
        User alice = userWithGuest("alice");
        User staff = newUser("sam", Role.STAFF);
        Reservation r = reservationOf(alice);
        String cash = "{\"reservationId\":" + r.getId() + ",\"method\":\"CASH\",\"receivedBy\":\"Sam\"}";

        mvc.perform(get("/api/reservations/" + r.getId()).header("Authorization", bearer(staff))).andExpect(status().isOk());
        mvc.perform(post("/api/payments").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                .content(cash)).andExpect(status().isForbidden());       // guests cannot record cash
        mvc.perform(post("/api/payments").header("Authorization", bearer(staff)).contentType(MediaType.APPLICATION_JSON)
                .content(cash)).andExpect(status().isCreated());
    }

    @Test
    void emailBelongingToAnotherAccountCannotBeClaimed() throws Exception {
        userWithGuest("alice");                       // owns alice@example.com
        User bob = newUser("bob", Role.GUEST);
        mvc.perform(post("/api/reservations").header("Authorization", bearer(bob)).contentType(MediaType.APPLICATION_JSON)
                .content(bookingJson(room("102").getId(), 1, in, out).replace("test@example.com", "alice@example.com")))
                .andExpect(status().isConflict());
    }

    @Test
    void registerLoginAndMe() throws Exception {
        String reg = "{\"username\":\"carol\",\"password\":\"password123\"}";
        String token = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(reg))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.user.role").value("GUEST"))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(reg))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(reg))
                .andExpect(status().isOk()).andExpect(jsonPath("$.token").isNotEmpty());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"carol\",\"password\":\"wrong-password\"}")).andExpect(status().isUnauthorized());
        String jwtValue = com.jayway.jsonpath.JsonPath.read(token, "$.token");
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + jwtValue))
                .andExpect(status().isOk()).andExpect(jsonPath("$.username").value("carol"));
    }

    @Test
    void meIncludesTheSavedGuestProfileAfterTheFirstBooking() throws Exception {
        User alice = newUser("alice", Role.GUEST);
        mvc.perform(get("/api/auth/me").header("Authorization", bearer(alice)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.guest").doesNotExist());

        mvc.perform(post("/api/reservations").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                .content(bookingJson(room("102").getId(), 2, in, out))).andExpect(status().isCreated());

        mvc.perform(get("/api/auth/me").header("Authorization", bearer(alice)))
                .andExpect(jsonPath("$.guest.email").value("test@example.com"))
                .andExpect(jsonPath("$.guest.name").value("Test Guest"));
    }

    @Test
    void weakCredentialsAreRejected() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"ab\",\"password\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.username").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    @Test
    void corsAllowsOnlyTheFrontendOrigin() throws Exception {
        mvc.perform(options("/api/reservations").header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
        mvc.perform(options("/api/reservations").header("Origin", "http://evil.example")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }
}
