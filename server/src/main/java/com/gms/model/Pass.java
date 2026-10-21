package com.gms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "passes")
public class Pass {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "pass_number", nullable = false, unique = true)
    private String passNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    @JsonIgnore
    private Booking booking;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pass_tier_id", nullable = false)
    private PassTier passTier;

    @Column(name = "attendee_name", nullable = false)
    private String attendeeName;

    @Column(name = "attendee_email")
    private String attendeeEmail;

    @Column(name = "attendee_phone")
    private String attendeePhone;

    @Column(name = "qr_signature_hash", nullable = false, length = 500)
    private String qrSignatureHash;

    @Column(name = "qr_payload", length = 1000)
    private String qrPayload;

    @Column(name = "status", nullable = false)
    private String status = "ACTIVE"; // ACTIVE, USED, REVOKED

    @Column(name = "entry_count", nullable = false)
    private int entryCount = 0;

    @Column(name = "max_entries", nullable = false)
    private int maxEntries = 1;

    @Column(name = "last_scanned_at")
    private Instant lastScannedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Pass() {
        this.id = UUID.randomUUID().toString();
    }

    public Pass(String passNumber, Booking booking, PassTier passTier, String attendeeName, String attendeeEmail, String attendeePhone, String qrSignatureHash, String qrPayload, int maxEntries) {
        this.id = UUID.randomUUID().toString();
        this.passNumber = passNumber;
        this.booking = booking;
        this.passTier = passTier;
        this.attendeeName = attendeeName;
        this.attendeeEmail = attendeeEmail;
        this.attendeePhone = attendeePhone;
        this.qrSignatureHash = qrSignatureHash;
        this.qrPayload = qrPayload;
        this.status = "ACTIVE";
        this.entryCount = 0;
        this.maxEntries = maxEntries > 0 ? maxEntries : 1;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getBookingId() {
        return booking != null ? booking.getId() : null;
    }

    public String getPassTierId() {
        return passTier != null ? passTier.getId() : null;
    }

    public String getTierName() {
        return passTier != null ? passTier.getTierName() : null;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPassNumber() {
        return passNumber;
    }

    public void setPassNumber(String passNumber) {
        this.passNumber = passNumber;
    }

    public Booking getBooking() {
        return booking;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }

    public PassTier getPassTier() {
        return passTier;
    }

    public void setPassTier(PassTier passTier) {
        this.passTier = passTier;
    }

    public String getAttendeeName() {
        return attendeeName;
    }

    public void setAttendeeName(String attendeeName) {
        this.attendeeName = attendeeName;
    }

    public String getAttendeeEmail() {
        return attendeeEmail;
    }

    public void setAttendeeEmail(String attendeeEmail) {
        this.attendeeEmail = attendeeEmail;
    }

    public String getAttendeePhone() {
        return attendeePhone;
    }

    public void setAttendeePhone(String attendeePhone) {
        this.attendeePhone = attendeePhone;
    }

    public String getQrSignatureHash() {
        return qrSignatureHash;
    }

    public void setQrSignatureHash(String qrSignatureHash) {
        this.qrSignatureHash = qrSignatureHash;
    }

    public String getQrPayload() {
        return qrPayload;
    }

    public void setQrPayload(String qrPayload) {
        this.qrPayload = qrPayload;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getEntryCount() {
        return entryCount;
    }

    public void setEntryCount(int entryCount) {
        this.entryCount = entryCount;
    }

    public int getMaxEntries() {
        return maxEntries;
    }

    public void setMaxEntries(int maxEntries) {
        this.maxEntries = maxEntries;
    }

    public Instant getLastScannedAt() {
        return lastScannedAt;
    }

    public void setLastScannedAt(Instant lastScannedAt) {
        this.lastScannedAt = lastScannedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
