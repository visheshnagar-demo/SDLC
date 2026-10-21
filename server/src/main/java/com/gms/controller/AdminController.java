package com.gms.controller;

import com.gms.service.AdminAnalyticsService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminAnalyticsService adminAnalyticsService;

    public AdminController(AdminAnalyticsService adminAnalyticsService) {
        this.adminAnalyticsService = adminAnalyticsService;
    }

    @GetMapping("/analytics/live")
    public ResponseEntity<Map<String, Object>> getLiveAnalytics() {
        Map<String, Object> analytics = adminAnalyticsService.getLiveAnalytics();
        return ResponseEntity.ok(analytics);
    }

    @PutMapping("/pass-tiers/{id}")
    public ResponseEntity<?> updatePassTier(@PathVariable String id,
                                            @RequestBody Map<String, Object> updates) {
        try {
            Map<String, Object> updated = adminAnalyticsService.updatePassTier(id, updates);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Failed to update pass tier: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    @GetMapping("/attendees/export")
    public ResponseEntity<byte[]> exportAttendeesCsv() {
        String csvData = adminAnalyticsService.generateAttendeesCsv();
        byte[] output = csvData.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "gms_attendees_export.csv");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(output, headers, HttpStatus.OK);
    }
}
