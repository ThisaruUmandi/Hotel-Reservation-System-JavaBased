package com.hotel.management.api;

import com.hotel.management.model.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminApiTest extends ApiTestBase {

    private Reservation stay(User owner, String roomNumber, LocalDate checkIn, LocalDate checkOut) {
        return reservations.save(new Reservation(owner.getGuest(), room(roomNumber), checkIn, checkOut, 1));
    }

    // ---------- who may enter ----------

    @Test
    void adminAreaIsForStaffOnly() throws Exception {
        mvc.perform(get("/api/admin/summary")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/summary").header("Authorization", bearer(newUser("guest1", Role.GUEST)))).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/summary").header("Authorization", bearer(newUser("sam", Role.STAFF)))).andExpect(status().isOk());
        mvc.perform(get("/api/admin/summary").header("Authorization", bearer(newUser("root", Role.ADMIN)))).andExpect(status().isOk());
    }

    @Test
    void staffAccountManagementIsForAdminsOnly() throws Exception {
        User staff = newUser("sam", Role.STAFF);
        mvc.perform(get("/api/admin/users").header("Authorization", bearer(staff))).andExpect(status().isForbidden());
        mvc.perform(post("/api/admin/users").header("Authorization", bearer(staff)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"newbie\",\"password\":\"password123\",\"role\":\"STAFF\"}")).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/users").header("Authorization", bearer(newUser("root", Role.ADMIN)))).andExpect(status().isOk());
    }

    // ---------- dashboard ----------

    @Test
    void summaryCountsTodaysMovements() throws Exception {
        User alice = userWithGuest("alice");
        LocalDate today = LocalDate.now();
        stay(alice, "101", today, today.plusDays(2));                      // arriving today
        stay(alice, "102", today.minusDays(2), today);                     // leaving today
        stay(alice, "201", today.minusDays(1), today.plusDays(3));         // in house
        Reservation cancelled = stay(alice, "101", today.plusDays(10), today.plusDays(12));
        cancelled.cancel(today);
        reservations.save(cancelled);

        mvc.perform(get("/api/admin/summary").header("Authorization", bearer(newUser("sam", Role.STAFF))))
                .andExpect(jsonPath("$.arrivalsToday").value(1))
                .andExpect(jsonPath("$.departuresToday").value(1))
                .andExpect(jsonPath("$.inHouse").value(2))        // the arrival and the guest already there
                .andExpect(jsonPath("$.totalRooms").value(3))
                .andExpect(jsonPath("$.awaitingPayment").value(3)) // three live bookings, none paid
                .andExpect(jsonPath("$.collected").value(0));
    }

    // ---------- cash payments and the paid flag ----------

    @Test
    void staffRecordsCashAndTheReservationShowsAsPaid() throws Exception {
        User alice = userWithGuest("alice");
        User staff = newUser("sam", Role.STAFF);
        Reservation r = stay(alice, "102", LocalDate.now().plusDays(5), LocalDate.now().plusDays(7));

        mvc.perform(get("/api/reservations").header("Authorization", bearer(staff)))
                .andExpect(jsonPath("$[0].paid").value(false));
        mvc.perform(post("/api/payments").header("Authorization", bearer(staff)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\":" + r.getId() + ",\"method\":\"CASH\",\"receivedBy\":\"sam\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.description").value("Cash received by sam"));

        mvc.perform(get("/api/reservations").header("Authorization", bearer(staff)))
                .andExpect(jsonPath("$[0].paid").value(true));
        mvc.perform(get("/api/reservations/" + r.getId()).header("Authorization", bearer(alice)))
                .andExpect(jsonPath("$.paid").value(true));
        mvc.perform(get("/api/admin/summary").header("Authorization", bearer(staff)))
                .andExpect(jsonPath("$.collected").value(r.getTotalPrice().doubleValue()))
                .andExpect(jsonPath("$.awaitingPayment").value(0));
    }

    // ---------- rooms ----------

    @Test
    void staffCanCloseARoomAndGuestsCanNoLongerBookIt() throws Exception {
        User staff = newUser("sam", Role.STAFF);
        User alice = newUser("alice", Role.GUEST);
        Room r = room("102");

        mvc.perform(patch("/api/admin/rooms/" + r.getId()).header("Authorization", bearer(staff)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"MAINTENANCE\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("MAINTENANCE"));
        mvc.perform(post("/api/reservations").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                .content(bookingJson(r.getId(), 2, in, out))).andExpect(status().isConflict());
        mvc.perform(get("/api/rooms/available").param("checkIn", in.toString()).param("checkOut", out.toString()).param("guests", "2"))
                .andExpect(jsonPath("$[*].roomNumber", not(hasItem("102"))));

        mvc.perform(patch("/api/admin/rooms/" + r.getId()).header("Authorization", bearer(staff)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"AVAILABLE\"}")).andExpect(status().isOk());
        mvc.perform(post("/api/reservations").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                .content(bookingJson(r.getId(), 2, in, out))).andExpect(status().isCreated());
    }

    @Test
    void onlyAdminsChangePricesAndOldBookingsKeepTheirPrice() throws Exception {
        User alice = userWithGuest("alice");
        Reservation r = stay(alice, "102", in, out);
        double before = r.getTotalPrice().doubleValue();
        Room room = room("102");

        mvc.perform(patch("/api/admin/rooms/" + room.getId()).header("Authorization", bearer(newUser("sam", Role.STAFF)))
                .contentType(MediaType.APPLICATION_JSON).content("{\"pricePerNight\":99999}")).andExpect(status().isForbidden());
        mvc.perform(patch("/api/admin/rooms/" + room.getId()).header("Authorization", bearer(newUser("root", Role.ADMIN)))
                .contentType(MediaType.APPLICATION_JSON).content("{\"pricePerNight\":25000}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.pricePerNight").value(25000.0));

        mvc.perform(get("/api/reservations/" + r.getId()).header("Authorization", bearer(alice)))
                .andExpect(jsonPath("$.totalPrice").value(before));
    }

    @Test
    void roomUpdatesAreValidated() throws Exception {
        String admin = bearer(newUser("root", Role.ADMIN));
        long id = room("101").getId();
        for (String bad : new String[]{"{\"pricePerNight\":0}", "{\"pricePerNight\":-5}", "{\"status\":\"BROKEN\"}"}) {
            mvc.perform(patch("/api/admin/rooms/" + id).header("Authorization", admin).contentType(MediaType.APPLICATION_JSON).content(bad))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(patch("/api/admin/rooms/999999").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"AVAILABLE\"}")).andExpect(status().isNotFound());
    }

    // ---------- staff accounts ----------

    @Test
    void adminCreatesAStaffAccountThatCanLogIn() throws Exception {
        String admin = bearer(newUser("root", Role.ADMIN));
        mvc.perform(post("/api/admin/users").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"nimal\",\"password\":\"password123\",\"role\":\"STAFF\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("STAFF"));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"nimal\",\"password\":\"password123\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.user.role").value("STAFF"));
        mvc.perform(post("/api/admin/users").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"nimal\",\"password\":\"password123\",\"role\":\"STAFF\"}")).andExpect(status().isConflict());
        mvc.perform(post("/api/admin/users").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"someone\",\"password\":\"password123\",\"role\":\"GUEST\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/admin/users").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"x\",\"password\":\"short\",\"role\":\"STAFF\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.username").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    @Test
    void anAdminCannotChangeTheirOwnRole() throws Exception {
        User root = newUser("root", Role.ADMIN);
        mvc.perform(patch("/api/admin/users/" + root.getId()).header("Authorization", bearer(root)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"GUEST\"}")).andExpect(status().isBadRequest());
    }

    @Test
    void aDemotedUsersExistingTokenStopsWorkingAtOnce() throws Exception {
        User admin = newUser("root", Role.ADMIN);
        User sam = newUser("sam", Role.STAFF);
        String samToken = bearer(sam);   // issued while sam was staff

        mvc.perform(get("/api/admin/summary").header("Authorization", samToken)).andExpect(status().isOk());
        mvc.perform(patch("/api/admin/users/" + sam.getId()).header("Authorization", bearer(admin)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"GUEST\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.role").value("GUEST"));

        mvc.perform(get("/api/admin/summary").header("Authorization", samToken)).andExpect(status().isForbidden());
        mvc.perform(get("/api/reservations").header("Authorization", samToken)).andExpect(status().isForbidden());
    }

    @Test
    void aDeletedUsersTokenIsRejected() throws Exception {
        User ghost = newUser("ghost", Role.GUEST);
        String token = bearer(ghost);
        users.delete(ghost);
        users.flush();
        mvc.perform(get("/api/auth/me").header("Authorization", token)).andExpect(status().isUnauthorized());
    }
}
