package com.hotel.management.api;

import com.hotel.management.model.*;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.ResultActions;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** The online payment lifecycle with PayHere switched on (fake keys; no network is used). */
@TestPropertySource(properties = {
        "app.payhere.merchant-id=1211149",
        "app.payhere.merchant-secret=TESTSECRET123",
        "app.payhere.notify-url=https://example.test/api/payments/payhere/notify",
})
class OnlinePaymentApiTest extends ApiTestBase {
    private static final String MERCHANT = "1211149";
    private static final String SECRET = "TESTSECRET123";

    // Written separately from the production code, so a mistake there cannot hide itself here.
    private static String md5(String s) throws Exception {
        StringBuilder hex = new StringBuilder();
        for (byte b : MessageDigest.getInstance("MD5").digest(s.getBytes(StandardCharsets.UTF_8))) hex.append(String.format("%02X", b));
        return hex.toString();
    }

    private Reservation stay(User owner) {
        return reservations.save(new Reservation(owner.getGuest(), room("102"), LocalDate.now().plusDays(10), LocalDate.now().plusDays(13), 2));
    }

    private String checkout(User user, Reservation r) throws Exception {
        return mvc.perform(post("/api/payments/online/checkout").header("Authorization", bearer(user))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reservationId\":" + r.getId() + "}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
    }

    private ResultActions notify(String orderId, String amount, String status, String signatureOverride) throws Exception {
        String sig = signatureOverride != null ? signatureOverride
                : md5(MERCHANT + orderId + amount + "LKR" + status + md5(SECRET));
        return mvc.perform(post("/api/payments/payhere/notify").contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("merchant_id", MERCHANT).param("order_id", orderId).param("payment_id", "320032345678")
                .param("payhere_amount", amount).param("payhere_currency", "LKR").param("status_code", status)
                .param("method", "VISA").param("status_message", "Successfully received the payment").param("md5sig", sig));
    }

    private String orderIdOf(String checkoutJson) { return JsonPath.read(checkoutJson, "$.fields.order_id"); }

    private void assertPaymentStatus(User owner, Reservation r, String expected) throws Exception {
        mvc.perform(get("/api/reservations/" + r.getId() + "/payments").header("Authorization", bearer(owner)))
                .andExpect(jsonPath("$[-1:].status").value(hasItem(expected)));
    }

    // ---------- options and starting a checkout ----------

    @Test
    void optionsReportOnlinePaymentsAndHideTheDemoCard() throws Exception {
        mvc.perform(get("/api/payments/options").header("Authorization", bearer(newUser("alice", Role.GUEST))))
                .andExpect(jsonPath("$.onlineEnabled").value(true))
                .andExpect(jsonPath("$.onlineProvider").value("PayHere"))
                .andExpect(jsonPath("$.sandbox").value(true))
                .andExpect(jsonPath("$.demoCardEnabled").value(false));
        mvc.perform(get("/api/payments/options")).andExpect(status().isUnauthorized());
    }

    @Test
    void checkoutReturnsASignedFormForTheRightAmount() throws Exception {
        User alice = userWithGuest("alice");
        Reservation r = stay(alice);
        String json = checkout(alice, r);

        String orderId = orderIdOf(json);
        String amount = r.getTotalPrice().setScale(2).toPlainString();
        org.junit.jupiter.api.Assertions.assertEquals("https://sandbox.payhere.lk/pay/checkout", JsonPath.read(json, "$.url"));
        org.junit.jupiter.api.Assertions.assertEquals(amount, JsonPath.read(json, "$.fields.amount"));
        org.junit.jupiter.api.Assertions.assertEquals(md5(MERCHANT + orderId + amount + "LKR" + md5(SECRET)), JsonPath.read(json, "$.fields.hash"));
        org.junit.jupiter.api.Assertions.assertFalse(json.contains(SECRET));
        assertPaymentStatus(alice, r, "PENDING");
    }

    @Test
    void checkoutRulesAreEnforced() throws Exception {
        User alice = userWithGuest("alice");
        User bob = userWithGuest("bob");
        Reservation r = stay(alice);
        // someone else's booking looks like it does not exist
        mvc.perform(post("/api/payments/online/checkout").header("Authorization", bearer(bob)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\":" + r.getId() + "}")).andExpect(status().isNotFound());
        mvc.perform(post("/api/payments/online/checkout").contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\":" + r.getId() + "}")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/payments/online/checkout").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                .content("{}")).andExpect(status().isBadRequest());

        // a finished stay cannot be paid online
        Reservation past = reservations.save(new Reservation(alice.getGuest(), room("201"), LocalDate.now().minusDays(5), LocalDate.now().minusDays(2), 1));
        mvc.perform(post("/api/payments/online/checkout").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\":" + past.getId() + "}")).andExpect(status().isConflict());
    }

    @Test
    void theDemoCardAndTheOnlineMethodAreNotAvailableThroughTheOldEndpoint() throws Exception {
        User alice = userWithGuest("alice");
        Reservation r = stay(alice);
        mvc.perform(post("/api/payments").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\":" + r.getId() + ",\"method\":\"CARD\",\"cardNumber\":\"4242424242424242\"}")).andExpect(status().isForbidden());
        mvc.perform(post("/api/payments").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\":" + r.getId() + ",\"method\":\"ONLINE\"}")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/reservations/" + r.getId() + "/payments").header("Authorization", bearer(alice)))
                .andExpect(jsonPath("$.length()").value(0)); // nothing was recorded at all
        mvc.perform(get("/api/reservations/" + r.getId()).header("Authorization", bearer(alice))).andExpect(jsonPath("$.paid").value(false));
    }

    // ---------- notifications ----------

    @Test
    void aGenuinePaidNotificationMarksTheBookingPaid() throws Exception {
        User alice = userWithGuest("alice");
        Reservation r = stay(alice);
        String orderId = orderIdOf(checkout(alice, r));
        String amount = r.getTotalPrice().setScale(2).toPlainString();

        notify(orderId, amount, "2", null).andExpect(status().isOk()).andExpect(content().string("OK"));

        assertPaymentStatus(alice, r, "PAID");
        mvc.perform(get("/api/reservations/" + r.getId()).header("Authorization", bearer(alice))).andExpect(jsonPath("$.paid").value(true));
        mvc.perform(get("/api/reservations/" + r.getId() + "/payments").header("Authorization", bearer(alice)))
                .andExpect(jsonPath("$[0].method").value("ONLINE")).andExpect(jsonPath("$[0].description").value("Online payment (VISA)"));
        // paying again is refused
        mvc.perform(post("/api/payments/online/checkout").header("Authorization", bearer(alice)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\":" + r.getId() + "}")).andExpect(status().isConflict());
    }

    @Test
    void receivingTheSameNotificationTwiceChangesNothing() throws Exception {
        User alice = userWithGuest("alice");
        Reservation r = stay(alice);
        String orderId = orderIdOf(checkout(alice, r));
        String amount = r.getTotalPrice().setScale(2).toPlainString();
        notify(orderId, amount, "2", null).andExpect(status().isOk());
        notify(orderId, amount, "2", null).andExpect(status().isOk());
        mvc.perform(get("/api/reservations/" + r.getId() + "/payments").header("Authorization", bearer(alice))).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/admin/summary").header("Authorization", bearer(newUser("sam", Role.STAFF))))
                .andExpect(jsonPath("$.collected").value(r.getTotalPrice().doubleValue())); // counted once
    }

    @Test
    void aForgedNotificationIsRejectedAndNothingIsPaid() throws Exception {
        User alice = userWithGuest("alice");
        Reservation r = stay(alice);
        String orderId = orderIdOf(checkout(alice, r));
        String amount = r.getTotalPrice().setScale(2).toPlainString();

        notify(orderId, amount, "2", "0".repeat(32)).andExpect(status().isBadRequest());
        notify(orderId, amount, "2", "").andExpect(status().isBadRequest());
        // a real signature for a failure, replayed as a success
        String failureSig = md5(MERCHANT + orderId + amount + "LKR" + "-2" + md5(SECRET));
        notify(orderId, amount, "2", failureSig).andExpect(status().isBadRequest());
        assertPaymentStatus(alice, r, "PENDING");
        mvc.perform(get("/api/reservations/" + r.getId()).header("Authorization", bearer(alice))).andExpect(jsonPath("$.paid").value(false));
    }

    @Test
    void aSignedNotificationForTheWrongAmountIsRejected() throws Exception {
        User alice = userWithGuest("alice");
        Reservation r = stay(alice);
        String orderId = orderIdOf(checkout(alice, r));
        notify(orderId, "1.00", "2", null).andExpect(status().isBadRequest());   // correctly signed, but only LKR 1
        assertPaymentStatus(alice, r, "PENDING");
    }

    @Test
    void anUnknownOrderIsRejected() throws Exception {
        notify("RES999-NOPE", "100.00", "2", null).andExpect(status().isNotFound());
    }

    @Test
    void failedAndPendingNotificationsAreHandled() throws Exception {
        User alice = userWithGuest("alice");
        Reservation r = stay(alice);
        String amount = r.getTotalPrice().setScale(2).toPlainString();

        String first = orderIdOf(checkout(alice, r));
        notify(first, amount, "0", null).andExpect(status().isOk());
        assertPaymentStatus(alice, r, "PENDING");     // still waiting
        notify(first, amount, "-2", null).andExpect(status().isOk());
        assertPaymentStatus(alice, r, "FAILED");

        String retry = orderIdOf(checkout(alice, r)); // a new attempt gets a new order id
        org.junit.jupiter.api.Assertions.assertNotEquals(first, retry);
        notify(retry, amount, "2", null).andExpect(status().isOk());
        assertPaymentStatus(alice, r, "PAID");
    }

    // ---------- refunds ----------

    @Test
    void cancellingAPaidOnlineBookingLeavesARefundForStaffToProcess() throws Exception {
        User alice = userWithGuest("alice");
        User staff = newUser("sam", Role.STAFF);
        Reservation r = stay(alice);
        String orderId = orderIdOf(checkout(alice, r));
        notify(orderId, r.getTotalPrice().setScale(2).toPlainString(), "2", null).andExpect(status().isOk());

        mvc.perform(delete("/api/reservations/" + r.getId()).header("Authorization", bearer(alice))).andExpect(status().isOk());
        assertPaymentStatus(alice, r, "REFUND_PENDING");   // not "REFUNDED": nobody has sent the money back yet

        mvc.perform(get("/api/admin/summary").header("Authorization", bearer(staff))).andExpect(jsonPath("$.refundsDue").value(1));
        String list = mvc.perform(get("/api/admin/refunds").header("Authorization", bearer(staff)))
                .andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].guestName").value("alice"))
                .andExpect(jsonPath("$[0].amount").value(r.getTotalPrice().doubleValue())).andReturn().getResponse().getContentAsString();
        int paymentId = JsonPath.read(list, "$[0].paymentId");

        mvc.perform(patch("/api/admin/payments/" + paymentId + "/refunded").header("Authorization", bearer(alice))).andExpect(status().isForbidden());
        mvc.perform(patch("/api/admin/payments/" + paymentId + "/refunded").header("Authorization", bearer(staff))).andExpect(status().isOk());
        assertPaymentStatus(alice, r, "REFUNDED");
        mvc.perform(get("/api/admin/refunds").header("Authorization", bearer(staff))).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(patch("/api/admin/payments/" + paymentId + "/refunded").header("Authorization", bearer(staff))).andExpect(status().isConflict()); // not twice
    }

    @Test
    void anAbandonedCheckoutIsClosedWhenTheBookingIsCancelled() throws Exception {
        User alice = userWithGuest("alice");
        Reservation r = stay(alice);
        String orderId = orderIdOf(checkout(alice, r));
        mvc.perform(delete("/api/reservations/" + r.getId()).header("Authorization", bearer(alice))).andExpect(status().isOk());
        assertPaymentStatus(alice, r, "FAILED");

        // PayHere reports a payment for the cancelled booking after all: the money must go back.
        notify(orderId, r.getTotalPrice().setScale(2).toPlainString(), "2", null).andExpect(status().isOk());
        assertPaymentStatus(alice, r, "REFUND_PENDING");
    }

    @Test
    void aChargebackIsRecorded() throws Exception {
        User alice = userWithGuest("alice");
        Reservation r = stay(alice);
        String orderId = orderIdOf(checkout(alice, r));
        String amount = r.getTotalPrice().setScale(2).toPlainString();
        notify(orderId, amount, "2", null).andExpect(status().isOk());
        notify(orderId, amount, "-3", null).andExpect(status().isOk());
        assertPaymentStatus(alice, r, "REFUNDED");
        mvc.perform(get("/api/reservations/" + r.getId()).header("Authorization", bearer(alice))).andExpect(jsonPath("$.paid").value(false));
    }
}
