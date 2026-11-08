package com.hotel.management.controller;

import com.hotel.management.dto.OnlineCheckoutRequest;
import com.hotel.management.dto.PaymentOptionsResponse;
import com.hotel.management.dto.PaymentRequest;
import com.hotel.management.gateway.CheckoutForm;
import com.hotel.management.service.OnlinePaymentService;
import com.hotel.management.dto.PaymentResponse;
import com.hotel.management.mapper.EntityMapper;
import com.hotel.management.security.AuthenticatedUser;
import com.hotel.management.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class PaymentController {
    private final PaymentService service;
    private final OnlinePaymentService online;
    private final EntityMapper mapper;

    public PaymentController(PaymentService service, OnlinePaymentService online, EntityMapper mapper) {
        this.service = service; this.online = online; this.mapper = mapper;
    }

    @GetMapping("/payments/options")
    public PaymentOptionsResponse options() { return online.options(); }

    /** Starts an online payment: returns the gateway URL and the signed fields the browser must post to it. */
    @PostMapping("/payments/online/checkout")
    public CheckoutForm checkout(@Valid @RequestBody OnlineCheckoutRequest req, @AuthenticationPrincipal AuthenticatedUser actor) {
        return online.startCheckout(actor, req.reservationId());
    }

    @PostMapping("/payments")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse pay(@Valid @RequestBody PaymentRequest req, @AuthenticationPrincipal AuthenticatedUser actor) {
        return mapper.toResponse(service.pay(actor, req));
    }

    @GetMapping("/reservations/{id}/payments")
    public List<PaymentResponse> forReservation(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser actor) {
        return service.forReservation(id, actor).stream().map(mapper::toResponse).toList();
    }
}
