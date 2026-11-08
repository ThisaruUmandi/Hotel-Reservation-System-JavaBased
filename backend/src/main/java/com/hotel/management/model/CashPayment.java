package com.hotel.management.model;

import jakarta.persistence.*;

@Entity
@DiscriminatorValue("CASH")
public class CashPayment extends Payment {
    private String receivedBy;

    protected CashPayment() {}
    public CashPayment(Reservation reservation, String receivedBy) {
        super(reservation); this.receivedBy = receivedBy;
    }

    @Override
    public String describe() { return "Cash received by " + receivedBy; }

    public String getReceivedBy() { return receivedBy; }
}
