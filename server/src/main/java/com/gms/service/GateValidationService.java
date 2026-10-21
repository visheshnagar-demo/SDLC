package com.gms.service;

import com.gms.model.GateCheckin;
import com.gms.model.Pass;
import com.gms.repository.GateCheckinRepository;
import com.gms.repository.PassRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class GateValidationService {

    private final PassRepository passRepository;
    private final GateCheckinRepository gateCheckinRepository;
    private final PassSecurityService passSecurityService;

    public GateValidationService(PassRepository passRepository,
                                 GateCheckinRepository gateCheckinRepository,
                                 PassSecurityService passSecurityService) {
        this.passRepository = passRepository;
        this.gateCheckinRepository = gateCheckinRepository;
        this.passSecurityService = passSecurityService;
    }

    @Transactional
    public Map<String, Object> validatePass(String gateIdentifier, String qrPayload, String scannedByUserId) {
        String gateId = gateIdentifier != null && !gateIdentifier.trim().isEmpty() ? gateIdentifier.trim() : "GATE-01-MAIN";
        Map<String, Object> response = new HashMap<>();

        Map<String, Object> payload;
        try {
            payload = passSecurityService.parseAndVerifyQrPayload(qrPayload);
        } catch (Exception e) {
            response.put("status", "INVALID_SIGNATURE");
            response.put("message", "Cryptographic signature validation failed: " + e.getMessage());
            return response;
        }

        String passId = (String) payload.get("pid");
        String passNumber = (String) payload.get("pnum");

        Optional<Pass> passOpt = Optional.empty();
        if (passId != null) {
            passOpt = passRepository.findById(passId);
        }
        if (passOpt.isEmpty() && passNumber != null) {
            passOpt = passRepository.findByPassNumber(passNumber);
        }

        if (passOpt.isEmpty()) {
            response.put("status", "INVALID_PASS");
            response.put("message", "Pass record not found in system");
            return response;
        }

        Pass pass = passOpt.get();

        if ("REVOKED".equalsIgnoreCase(pass.getStatus())) {
            GateCheckin checkin = new GateCheckin(pass, gateId, scannedByUserId, "REVOKED", "Attempted entry with revoked pass");
            gateCheckinRepository.save(checkin);

            response.put("status", "REVOKED");
            response.put("message", "Pass has been revoked by event security");
            response.put("passId", pass.getId());
            response.put("attendeeName", pass.getAttendeeName());
            return response;
        }

        // Duplicate entry check
        if (pass.getEntryCount() >= pass.getMaxEntries()) {
            GateCheckin checkin = new GateCheckin(pass, gateId, scannedByUserId, "DUPLICATE_BLOCKED", "Duplicate entry attempt blocked");
            gateCheckinRepository.save(checkin);

            response.put("status", "ALREADY_USED");
            response.put("message", "Pass has already been used (Max entries: " + pass.getMaxEntries() + ")");
            response.put("passId", pass.getId());
            response.put("attendeeName", pass.getAttendeeName());
            response.put("tierName", pass.getTierName());
            response.put("firstCheckedInAt", pass.getLastScannedAt() != null ? pass.getLastScannedAt().toString() : Instant.now().toString());
            return response;
        }

        // Valid entry
        Instant now = Instant.now();
        pass.setEntryCount(pass.getEntryCount() + 1);
        pass.setLastScannedAt(now);
        if (pass.getEntryCount() >= pass.getMaxEntries()) {
            pass.setStatus("USED");
        }
        passRepository.save(pass);

        GateCheckin checkin = new GateCheckin(pass, gateId, scannedByUserId, "SUCCESS", "Authorized entry");
        gateCheckinRepository.save(checkin);

        response.put("status", "VALID");
        response.put("message", "Entry Authorized");
        response.put("passId", pass.getId());
        response.put("attendeeName", pass.getAttendeeName());
        response.put("tierName", pass.getTierName());
        response.put("checkedInAt", now.toString());
        response.put("entryCount", pass.getEntryCount());
        response.put("maxEntries", pass.getMaxEntries());
        return response;
    }
}
