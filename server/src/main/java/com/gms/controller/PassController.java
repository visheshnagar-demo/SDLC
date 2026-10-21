package com.gms.controller;

import com.gms.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/passes")
public class PassController {

    private final BookingService bookingService;

    public PassController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listPasses(
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(defaultValue = "50") int limit) {
        List<Map<String, Object>> passes = bookingService.listAllPasses(skip, limit);
        return ResponseEntity.ok(passes);
    }

    @GetMapping("/my-passes")
    public ResponseEntity<List<Map<String, Object>>> getMyPasses(
            Authentication authentication,
            @RequestParam(required = false) String email) {
        String userEmail = email;
        if (userEmail == null && authentication != null) {
            userEmail = authentication.getName();
        }
        if (userEmail == null) {
            userEmail = "test@example.com";
        }

        List<Map<String, Object>> passes = bookingService.getPassesByEmailOrUser(userEmail);
        return ResponseEntity.ok(passes);
    }

    @GetMapping("/{passId}")
    public ResponseEntity<?> getPassById(@PathVariable String passId) {
        try {
            Map<String, Object> pass = bookingService.getPassById(passId);
            return ResponseEntity.ok(pass);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
    }
}
