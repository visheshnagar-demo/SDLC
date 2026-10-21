package com.gms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "gate_checkins")
public class GateCheckin {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pass_id", nullable = false)
    @JsonIgnore
    private Pass pass;

    @Column(name = "gate_identifier", nullable = false)
    private String gateIdentifier;

    @Column(name = "scanned_by_user_id")
    private String scannedByUserId;

    @Column(name = "scan_result", nullable = false)
    private String scanResult; // SUCCESS, DUPLICATE_BLOCKED, EXPIRED, INVALID_SIGNATURE

    @Column(name = "scan_timestamp", nullable = false)
    private Instant scanTimestamp = Instant.now();

    @Column(name = "notes")
    private String notes;

    public GateCheckin() {
        this.id = UUID.randomUUID().toString();
    }

    public GateCheckin(Pass pass, String gateIdentifier, String scannedByUserId, String scanResult, String notes) {
        this.id = UUID.randomUUID().toString();
        this.pass = pass;
        this.gateIdentifier = gateIdentifier;
        this.scannedByUserId = scannedByUserId;
        this.scanResult = scanResult;
        this.scanTimestamp = Instant.now();
        this.notes = notes;
    }

    public String getPassId() {
        return pass != null ? pass.getId() : null;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Pass getPass() {
        return pass;
    }

    public void setPass(Pass pass) {
        this.pass = pass;
    }

    public String getGateIdentifier() {
        return gateIdentifier;
    }

    public void setGateIdentifier(String gateIdentifier) {
        this.gateIdentifier = gateIdentifier;
    }

    public String getScannedByUserId() {
        return scannedByUserId;
    }

    public void setScannedByUserId(String scannedByUserId) {
        this.scannedByUserId = scannedByUserId;
    }

    public String getScanResult() {
        return scanResult;
    }

    public void setScanResult(String scanResult) {
        this.scanResult = scanResult;
    }

    public Instant getScanTimestamp() {
        return scanTimestamp;
    }

    public void setScanTimestamp(Instant scanTimestamp) {
        this.scanTimestamp = scanTimestamp;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
