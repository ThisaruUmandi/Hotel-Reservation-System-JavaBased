package com.hotel.management.controller;

import com.hotel.management.service.OnlinePaymentService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * PayHere calls this from its own servers, so it is public (see SecurityConfig). It is protected by the
 * signature on every notification, not by a login.
 */
@RestController
@RequestMapping("/api/payments/payhere")
public class PayHereWebhookController {
    private final OnlinePaymentService online;

    public PayHereWebhookController(OnlinePaymentService online) { this.online = online; }

    @PostMapping(value = "/notify", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<String> notify(@RequestParam Map<String, String> form) {
        online.handleNotification("PAYHERE", form);
        return ResponseEntity.ok("OK");
    }
}
