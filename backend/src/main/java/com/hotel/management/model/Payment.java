package com.hotel.management.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Abstract payment; each payment method is a subclass that describes itself. */
@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "payment_type", length = 20)
public abstract class Payment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    private Reservation reservation;
    @Column(nullable = false)
    private BigDecimal amount;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;
    private LocalDateTime paidAt;

    protected Payment() {}
    protected Payment(Reservation reservation) {
        this.reservation = reservation;
        this.amount = reservation.getTotalPrice();
    }

    public void markPaid() { status = PaymentStatus.PAID; paidAt = LocalDateTime.now(); }

    public void refund() {
        if (status != PaymentStatus.PAID) throw new IllegalStateException("Only paid payments can be refunded");
        status = PaymentStatus.REFUNDED;
    }

    public abstract PaymentMethod getMethod();

    public abstract String describe();

    public Long getId() { return id; }
    public Reservation getReservation() { return reservation; }
    public BigDecimal getAmount() { return amount; }
    public PaymentStatus getStatus() { return status; }
    public LocalDateTime getPaidAt() { return paidAt; }
}
