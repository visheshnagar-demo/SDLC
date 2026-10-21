package com.gms.controller;

import com.gms.model.Event;
import com.gms.model.PassTier;
import com.gms.repository.EventRepository;
import com.gms.repository.PassTierRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/events")
public class EventController {

    private final EventRepository eventRepository;
    private final PassTierRepository passTierRepository;

    public EventController(EventRepository eventRepository, PassTierRepository passTierRepository) {
        this.eventRepository = eventRepository;
        this.passTierRepository = passTierRepository;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listEvents() {
        List<Event> events = eventRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Event event : events) {
            result.add(toEventDto(event));
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getEventById(@PathVariable String id) {
        Optional<Event> eventOpt = eventRepository.findById(id);
        if (eventOpt.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Event not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
        return ResponseEntity.ok(toEventDto(eventOpt.get()));
    }

    @GetMapping("/{id}/tiers")
    public ResponseEntity<List<Map<String, Object>>> getEventTiers(@PathVariable String id) {
        List<PassTier> tiers = passTierRepository.findByEventId(id);
        List<Map<String, Object>> result = new ArrayList<>();
        for (PassTier tier : tiers) {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", tier.getId());
            dto.put("eventId", tier.getEventId());
            dto.put("tierName", tier.getTierName());
            dto.put("description", tier.getDescription());
            dto.put("price", tier.getPrice());
            dto.put("totalQuota", tier.getTotalQuota());
            dto.put("availableQuota", tier.getAvailableQuota());
            dto.put("validFrom", tier.getValidFrom().toString());
            dto.put("validTo", tier.getValidTo().toString());
            dto.put("status", tier.getAvailableQuota() > 0 ? "AVAILABLE" : "SOLD_OUT");
            result.add(dto);
        }
        return ResponseEntity.ok(result);
    }

    private Map<String, Object> toEventDto(Event event) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", event.getId());
        dto.put("title", event.getTitle());
        dto.put("description", event.getDescription());
        dto.put("venueName", event.getVenueName());
        dto.put("startDate", event.getStartDate().toString());
        dto.put("endDate", event.getEndDate().toString());
        dto.put("status", event.getStatus());
        dto.put("createdAt", event.getCreatedAt().toString());
        return dto;
    }
}
