package com.hotel.management.api;

import com.hotel.management.model.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Without PayHere keys the site still works: the demo card is available and the online route says no. */
class OnlinePaymentsOffApiTest extends ApiTestBase {

    @Test
    void optionsShowOnlinePaymentsOffAndTheDemoCardOn() throws Exception {
        mvc.perform(get("/api/payments/options").header("Authorization", bearer(newUser("alice", Role.GUEST))))
                .andExpect(jsonPath("$.onlineEnabled").value(false))
                .andExpect(jsonPath("$.demoCardEnabled").value(true));
    }

    @Test
    void checkoutIsRefusedAndTheNotificationEndpointIgnoresEveryone() throws Exception {
        User alice = userWithGuest("alice");
        Reservation r = reservations.save(new Reservation(alice.getGuest(), room("102"), LocalDate.now().plusDays(10), LocalDate.now().plusDays(12), 2));
        mvc.perform(post("/api/payments/online/checkout").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\":" + r.getId() + "}")).andExpect(status().isConflict());
        mvc.perform(post("/api/payments/payhere/notify").contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("merchant_id", "").param("order_id", "RES1-A").param("md5sig", "X")).andExpect(status().isNotFound());
    }
}
