package com.gms.controller;

import com.gms.service.GateValidationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/gates")
public class GateController {

    private final GateValidationService gateValidationService;

    public GateController(GateValidationService gateValidationService) {
        this.gateValidationService = gateValidationService;
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validatePass(@RequestBody Map<String, String> request,
                                          Authentication authentication) {
        String gateIdentifier = request.get("gateIdentifier");
        String qrPayload = request.get("qrPayload");

        if (qrPayload == null || qrPayload.trim().isEmpty()) {
            Map<String, Object> err = new HashMap<>();
            err.put("status", "INVALID_PAYLOAD");
            err.put("message", "QR payload is required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }

        String scannedByUserId = authentication != null ? authentication.getName() : "GATE_STAFF";
        Map<String, Object> result = gateValidationService.validatePass(gateIdentifier, qrPayload, scannedByUserId);

        String status = (String) result.get("status");
        if ("INVALID_SIGNATURE".equals(status) || "INVALID_PAYLOAD".equals(status)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
        } else if ("INVALID_PASS".equals(status)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(result);
        } else if ("ALREADY_USED".equals(status) || "REVOKED".equals(status)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(result);
        }

        return ResponseEntity.ok(result);
    }
}
