package com.gms.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class PassSecurityService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gms.hmac.secret:GarbaFest2026MasterHmacSecretKeyForSignedQrCodes}")
    private String hmacSecret;

    public String generateHmacSha256(String data) {
        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(hmacSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] signedBytes = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signedBytes);
        } catch (Exception e) {
            throw new RuntimeException("Error calculating HMAC SHA-256", e);
        }
    }

    public String generateSignedQrPayload(String passId, String passNumber, String eventId, String attendeeName, String tierName, String validDate) {
        try {
            Map<String, Object> payloadMap = new HashMap<>();
            payloadMap.put("pid", passId);
            payloadMap.put("pnum", passNumber);
            payloadMap.put("eid", eventId);
            payloadMap.put("name", attendeeName);
            payloadMap.put("tier", tierName);
            payloadMap.put("date", validDate);
            payloadMap.put("ts", System.currentTimeMillis());

            String jsonPayload = objectMapper.writeValueAsString(payloadMap);
            String encodedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(jsonPayload.getBytes(StandardCharsets.UTF_8));
            String signature = generateHmacSha256(encodedPayload);

            return "GMSv1." + encodedPayload + "." + signature;
        } catch (Exception e) {
            throw new RuntimeException("Error generating signed QR payload", e);
        }
    }

    public boolean verifySignature(String encodedPayload, String providedSignature) {
        try {
            String expectedSignature = generateHmacSha256(encodedPayload);
            return MessageDigest.isEqual(
                    expectedSignature.getBytes(StandardCharsets.UTF_8),
                    providedSignature.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            return false;
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> parseAndVerifyQrPayload(String qrPayload) {
        if (qrPayload == null || !qrPayload.startsWith("GMSv1.")) {
            throw new IllegalArgumentException("Invalid QR Code prefix or format");
        }

        String[] parts = qrPayload.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Malformed QR Code structure");
        }

        String encodedPayload = parts[1];
        String signature = parts[2];

        if (!verifySignature(encodedPayload, signature)) {
            throw new SecurityException("INVALID_SIGNATURE: Cryptographic verification failed");
        }

        try {
            byte[] decodedJson = Base64.getUrlDecoder().decode(encodedPayload);
            return objectMapper.readValue(decodedJson, Map.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to decode pass payload", e);
        }
    }
}
