package com.hotel.management.gateway;

import com.hotel.management.exception.InvalidSignatureException;
import com.hotel.management.model.*;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class PayHereGatewayTest {
    private static final String MERCHANT = "1211149";
    private static final String SECRET = "TESTSECRET123";
    private final PayHereGateway gateway = new PayHereGateway(MERCHANT, SECRET, "https://example.test/notify", true, "http://localhost:5173/");

    // These two values were worked out separately with Python's md5, following PayHere's documented formulas.
    private static final String KNOWN_HASH = "E081E5C5683BE79025F53BBFADB8AFCF";   // 1211149 + RES1-ABC + 1000.00 + LKR + upper(md5(secret))
    private static final String KNOWN_SIG = "2C781C58A982262A93331186169FB277";    // ... + status_code 2

    private Map<String, String> notice(String status, String amount, String sig) {
        Map<String, String> m = new HashMap<>();
        m.put("merchant_id", MERCHANT); m.put("order_id", "RES1-ABC"); m.put("payment_id", "320032345678");
        m.put("payhere_amount", amount); m.put("payhere_currency", "LKR"); m.put("status_code", status);
        m.put("method", "VISA"); m.put("status_message", "Successfully received the payment"); m.put("md5sig", sig);
        return m;
    }

    @Test
    void requestHashMatchesPayHeresFormula() {
        assertEquals(KNOWN_HASH, gateway.checkoutHash("RES1-ABC", "1000.00"));
    }

    @Test
    void notificationSignatureMatchesPayHeresFormula() {
        assertEquals(KNOWN_SIG, gateway.notificationSignature(MERCHANT, "RES1-ABC", "1000.00", "LKR", "2"));
    }

    @Test
    void aGenuineNotificationIsAccepted() {
        GatewayNotification n = gateway.verify(notice("2", "1000.00", KNOWN_SIG));
        assertEquals(GatewayOutcome.PAID, n.outcome());
        assertEquals("RES1-ABC", n.orderId());
        assertEquals(0, new BigDecimal("1000.00").compareTo(n.amount()));
        assertEquals("VISA", n.method());
    }

    @Test
    void signatureCaseDoesNotMatter() {
        assertDoesNotThrow(() -> gateway.verify(notice("2", "1000.00", KNOWN_SIG.toLowerCase())));
    }

    @Test
    void aForgedOrTamperedNotificationIsRejected() {
        assertThrows(InvalidSignatureException.class, () -> gateway.verify(notice("2", "1000.00", "0".repeat(32))));   // made up
        assertThrows(InvalidSignatureException.class, () -> gateway.verify(notice("2", "1.00", KNOWN_SIG)));           // amount changed
        assertThrows(InvalidSignatureException.class, () -> gateway.verify(notice("-2", "1000.00", KNOWN_SIG)));       // status changed
        assertThrows(InvalidSignatureException.class, () -> gateway.verify(notice("2", "1000.00", "")));               // no signature
        Map<String, String> other = notice("2", "1000.00", KNOWN_SIG);
        other.put("merchant_id", "9999999");                                                                         // someone else's merchant
        assertThrows(InvalidSignatureException.class, () -> gateway.verify(other));
        assertThrows(InvalidSignatureException.class, () -> gateway.verify(new HashMap<>()));
    }

    @Test
    void statusCodesMapToOutcomes() {
        assertEquals(GatewayOutcome.PAID, PayHereGateway.outcome("2"));
        assertEquals(GatewayOutcome.PENDING, PayHereGateway.outcome("0"));
        assertEquals(GatewayOutcome.FAILED, PayHereGateway.outcome("-1"));
        assertEquals(GatewayOutcome.FAILED, PayHereGateway.outcome("-2"));
        assertEquals(GatewayOutcome.CHARGED_BACK, PayHereGateway.outcome("-3"));
        assertEquals(GatewayOutcome.FAILED, PayHereGateway.outcome("surprise"));
        assertEquals(GatewayOutcome.FAILED, PayHereGateway.outcome(null));
    }

    @Test
    void amountsAreWrittenWithTwoDecimalsAndNoSeparators() {
        assertEquals("55500.00", PayHereGateway.formatAmount(new BigDecimal("55500")));
        assertEquals("55500.50", PayHereGateway.formatAmount(new BigDecimal("55500.5")));
        assertEquals("1250000.00", PayHereGateway.formatAmount(new BigDecimal("1250000")));
        assertEquals("0.10", PayHereGateway.formatAmount(new BigDecimal("0.1")));
    }

    @Test
    void namesAreSplitForPayHere() {
        assertArrayEquals(new String[]{"Amaya", "Fernando"}, PayHereGateway.splitName("Amaya Fernando"));
        assertArrayEquals(new String[]{"Amaya", "de Silva"}, PayHereGateway.splitName("  Amaya   de Silva "));
        assertArrayEquals(new String[]{"Madonna", "Madonna"}, PayHereGateway.splitName("Madonna")); // PayHere needs both
    }

    @Test
    void itIsOnlyEnabledWhenAllKeysAreSet() {
        assertTrue(gateway.isEnabled());
        assertFalse(new PayHereGateway("", SECRET, "https://x", true, "http://localhost").isEnabled());
        assertFalse(new PayHereGateway(MERCHANT, "", "https://x", true, "http://localhost").isEnabled());
        assertFalse(new PayHereGateway(MERCHANT, SECRET, "", true, "http://localhost").isEnabled());
    }

    @Test
    void theCheckoutFormCarriesAValidHashAndNoSecret() {
        Room room = new Room("102", new RoomType("DOUBLE", "d", 2, ""), new BigDecimal("18500"));
        Guest guest = new Guest("Amaya Fernando", "amaya@example.com", "0771234567");
        Reservation r = new Reservation(guest, room, LocalDate.now().plusDays(5), LocalDate.now().plusDays(8), 2);
        GatewayPayment payment = new GatewayPayment(r, "PAYHERE", "RES9-ZZZ");

        CheckoutForm form = gateway.createCheckout(payment, r);
        assertEquals("https://sandbox.payhere.lk/pay/checkout", form.url());
        Map<String, String> f = form.fields();
        assertEquals("55500.00", f.get("amount"));
        assertEquals("LKR", f.get("currency"));
        assertEquals("RES9-ZZZ", f.get("order_id"));
        assertEquals(gateway.checkoutHash("RES9-ZZZ", "55500.00"), f.get("hash"));
        assertEquals("https://example.test/notify", f.get("notify_url"));
        assertTrue(f.get("return_url").endsWith("/bookings/" + r.getId() + "?payment=return"));
        assertFalse(f.values().stream().anyMatch(v -> v.contains(SECRET)), "the merchant secret must never be sent to the browser");
        // exactly the fields PayHere's documentation lists as required
        assertEquals(java.util.Set.of("merchant_id", "return_url", "cancel_url", "notify_url", "first_name", "last_name", "email", "phone",
                "address", "city", "country", "order_id", "items", "currency", "amount", "hash"), f.keySet());

        PayHereGateway live = new PayHereGateway(MERCHANT, SECRET, "https://example.test/notify", false, "http://localhost");
        assertEquals("https://www.payhere.lk/pay/checkout", live.createCheckout(payment, r).url());
    }
}
