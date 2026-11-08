package com.hotel.management.gateway;

import com.hotel.management.exception.InvalidSignatureException;
import com.hotel.management.model.Guest;
import com.hotel.management.model.GatewayPayment;
import com.hotel.management.model.Reservation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * PayHere (Sri Lanka). The guest is sent to PayHere's checkout page; PayHere then calls our notify URL.
 * Rules from PayHere's Checkout API documentation:
 * <pre>
 *   hash   = upper(md5(merchant_id + order_id + amount + currency + upper(md5(merchant_secret))))
 *   md5sig = upper(md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + upper(md5(merchant_secret))))
 * </pre>
 * The amount is written with two decimals and no thousands separator. status_code: 2 success, 0 pending,
 * -1 cancelled, -2 failed, -3 charged back. The merchant secret never leaves this server.
 */
@Component
public class PayHereGateway implements PaymentGateway {
    static final String SANDBOX_URL = "https://sandbox.payhere.lk/pay/checkout";
    static final String LIVE_URL = "https://www.payhere.lk/pay/checkout";
    static final String CURRENCY = "LKR";

    private final String merchantId;
    private final String merchantSecret;
    private final String notifyUrl;
    private final boolean sandbox;
    private final String frontendUrl;

    public PayHereGateway(@Value("${app.payhere.merchant-id}") String merchantId,
                          @Value("${app.payhere.merchant-secret}") String merchantSecret,
                          @Value("${app.payhere.notify-url}") String notifyUrl,
                          @Value("${app.payhere.sandbox}") boolean sandbox,
                          @Value("${app.payhere.frontend-url}") String frontendUrl) {
        this.merchantId = merchantId.trim();
        this.merchantSecret = merchantSecret.trim();
        this.notifyUrl = notifyUrl.trim();
        this.sandbox = sandbox;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    @Override public String name() { return "PAYHERE"; }
    @Override public String displayName() { return "PayHere"; }
    @Override public boolean isSandbox() { return sandbox; }

    @Override
    public boolean isEnabled() { return !merchantId.isEmpty() && !merchantSecret.isEmpty() && !notifyUrl.isEmpty(); }

    @Override
    public CheckoutForm createCheckout(GatewayPayment payment, Reservation reservation) {
        Guest guest = reservation.getGuest();
        String[] names = splitName(guest.getName());
        String amount = formatAmount(payment.getAmount());
        String orderId = payment.getOrderId();

        Map<String, String> f = new LinkedHashMap<>();
        f.put("merchant_id", merchantId);
        f.put("return_url", frontendUrl + "/bookings/" + reservation.getId() + "?payment=return");
        f.put("cancel_url", frontendUrl + "/bookings/" + reservation.getId() + "?payment=cancelled");
        f.put("notify_url", notifyUrl);
        f.put("first_name", names[0]);
        f.put("last_name", names[1]);
        f.put("email", guest.getEmail());
        f.put("phone", guest.getPhone() == null || guest.getPhone().isBlank() ? "0000000000" : guest.getPhone());
        // PayHere requires these; they are shown to the guest on PayHere's page, where they can change them.
        f.put("address", "Colombo");
        f.put("city", "Colombo");
        f.put("country", "Sri Lanka");
        f.put("order_id", orderId);
        f.put("items", "Room " + reservation.getRoom().getRoomNumber() + ", " + reservation.nights() + " night(s)");
        f.put("currency", CURRENCY);
        f.put("amount", amount);
        f.put("hash", checkoutHash(orderId, amount));
        return new CheckoutForm(sandbox ? SANDBOX_URL : LIVE_URL, f);
    }

    @Override
    public GatewayNotification verify(Map<String, String> n) {
        String received = n.getOrDefault("md5sig", "");
        String expected = notificationSignature(n.getOrDefault("merchant_id", ""), n.getOrDefault("order_id", ""),
                n.getOrDefault("payhere_amount", ""), n.getOrDefault("payhere_currency", ""), n.getOrDefault("status_code", ""));
        // Constant-time comparison, and it must be our own merchant account that the notice is about.
        boolean genuine = MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), received.toUpperCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8))
                && merchantId.equals(n.get("merchant_id"));
        if (!genuine) throw new InvalidSignatureException();

        BigDecimal amount;
        try { amount = new BigDecimal(n.get("payhere_amount")); } catch (NumberFormatException | NullPointerException e) { throw new InvalidSignatureException(); }
        return new GatewayNotification(n.get("order_id"), n.get("payment_id"), amount, n.get("payhere_currency"),
                outcome(n.get("status_code")), n.get("method"), n.get("status_message"));
    }

    static GatewayOutcome outcome(String statusCode) {
        return switch (statusCode == null ? "" : statusCode.trim()) {
            case "2" -> GatewayOutcome.PAID;
            case "0" -> GatewayOutcome.PENDING;
            case "-3" -> GatewayOutcome.CHARGED_BACK;
            default -> GatewayOutcome.FAILED; // -1 cancelled, -2 failed, anything unexpected
        };
    }

    String checkoutHash(String orderId, String amount) {
        return md5Upper(merchantId + orderId + amount + CURRENCY + md5Upper(merchantSecret));
    }

    String notificationSignature(String merchant, String orderId, String amount, String currency, String statusCode) {
        return md5Upper(merchant + orderId + amount + currency + statusCode + md5Upper(merchantSecret));
    }

    /** Two decimals, a dot, no thousands separator: the form PayHere signs. */
    static String formatAmount(BigDecimal amount) { return amount.setScale(2, RoundingMode.HALF_UP).toPlainString(); }

    static String[] splitName(String fullName) {
        String[] parts = fullName.trim().split("\\s+", 2);
        return new String[]{parts[0], parts.length > 1 ? parts[1] : parts[0]};
    }

    static String md5Upper(String text) {
        try {
            byte[] digest = MessageDigest.getInstance("MD5").digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) hex.append(String.format("%02X", b));
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("MD5 is not available", e);
        }
    }
}
