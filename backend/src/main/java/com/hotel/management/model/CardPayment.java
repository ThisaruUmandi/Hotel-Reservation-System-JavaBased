package com.hotel.management.model;

import jakarta.persistence.*;

@Entity
@DiscriminatorValue("CARD")
public class CardPayment extends Payment {
    private String cardBrand;
    @Column(name = "card_last4", length = 4)
    private String cardLast4;

    protected CardPayment() {}
    public CardPayment(Reservation reservation, String cardBrand, String cardLast4) {
        super(reservation); this.cardBrand = cardBrand; this.cardLast4 = cardLast4;
    }

    @Override
    public String describe() { return cardBrand + " ending " + cardLast4; }

    public String getCardBrand() { return cardBrand; }
    public String getCardLast4() { return cardLast4; }
}
