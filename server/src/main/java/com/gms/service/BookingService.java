package com.gms.service;

import com.gms.model.Booking;
import com.gms.model.Event;
import com.gms.model.Pass;
import com.gms.model.PassTier;
import com.gms.model.User;
import com.gms.repository.BookingRepository;
import com.gms.repository.EventRepository;
import com.gms.repository.PassRepository;
import com.gms.repository.PassTierRepository;
import com.gms.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PassRepository passRepository;
    private final PassTierRepository passTierRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final PassSecurityService passSecurityService;

    public BookingService(BookingRepository bookingRepository,
                          PassRepository passRepository,
                          PassTierRepository passTierRepository,
                          EventRepository eventRepository,
                          UserRepository userRepository,
                          PassSecurityService passSecurityService) {
        this.bookingRepository = bookingRepository;
        this.passRepository = passRepository;
        this.passTierRepository = passTierRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.passSecurityService = passSecurityService;
    }

    @Transactional
    public Map<String, Object> createBooking(String userEmail, String eventId, String passTierId, int quantity, List<Map<String, String>> attendees) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be at least 1");
        }

        PassTier passTier = passTierRepository.findById(passTierId)
                .orElseThrow(() -> new IllegalArgumentException("Pass tier not found"));

        if (passTier.getAvailableQuota() < quantity) {
            throw new IllegalStateException("Requested pass tier is sold out or insufficient quota available");
        }

        Event event = passTier.getEvent();
        if (eventId != null && !event.getId().equals(eventId)) {
            event = eventRepository.findById(eventId).orElse(event);
        }

        User user = null;
        if (userEmail != null && !userEmail.trim().isEmpty()) {
            user = userRepository.findByEmail(userEmail.trim().toLowerCase()).orElse(null);
        }

        if (user == null) {
            // Auto-provision guest or attendee user
            String defaultEmail = (attendees != null && !attendees.isEmpty() && attendees.get(0).get("email") != null)
                    ? attendees.get(0).get("email").trim().toLowerCase()
                    : "guest_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
            user = userRepository.findByEmail(defaultEmail).orElseGet(() -> {
                String name = (attendees != null && !attendees.isEmpty() && attendees.get(0).get("fullName") != null)
                        ? attendees.get(0).get("fullName")
                        : "Garba Attendee";
                User newUser = new User(defaultEmail, "NOPASSWORD", name, "", "ATTENDEE");
                return userRepository.save(newUser);
            });
        }

        // Atomic quota decrement
        passTier.setAvailableQuota(passTier.getAvailableQuota() - quantity);
        passTierRepository.save(passTier);

        BigDecimal totalAmount = passTier.getPrice().multiply(BigDecimal.valueOf(quantity));
        String bookingRef = "GMS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Booking booking = new Booking(bookingRef, user, event, totalAmount, "CONFIRMED");
        Booking savedBooking = bookingRepository.save(booking);

        List<Map<String, Object>> createdPasses = new ArrayList<>();
        int maxEntries = passTier.getTierName().toLowerCase().contains("season") ? 9 : 1;

        for (int i = 0; i < quantity; i++) {
            String attendeeName = user.getFullName();
            String attendeeEmail = user.getEmail();
            String attendeePhone = user.getPhone();

            if (attendees != null && i < attendees.size()) {
                Map<String, String> att = attendees.get(i);
                if (att.get("fullName") != null && !att.get("fullName").trim().isEmpty()) {
                    attendeeName = att.get("fullName").trim();
                }
                if (att.get("email") != null && !att.get("email").trim().isEmpty()) {
                    attendeeEmail = att.get("email").trim();
                }
                if (att.get("phone") != null && !att.get("phone").trim().isEmpty()) {
                    attendeePhone = att.get("phone").trim();
                }
            }

            String passNumber = "PASS-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();
            String validDate = passTier.getValidFrom().format(DateTimeFormatter.ISO_DATE);

            Pass pass = new Pass();
            pass.setPassNumber(passNumber);
            pass.setBooking(savedBooking);
            pass.setPassTier(passTier);
            pass.setAttendeeName(attendeeName);
            pass.setAttendeeEmail(attendeeEmail);
            pass.setAttendeePhone(attendeePhone);
            pass.setMaxEntries(maxEntries);
            pass.setStatus("ACTIVE");

            String qrPayload = passSecurityService.generateSignedQrPayload(
                    pass.getId(),
                    passNumber,
                    event.getId(),
                    attendeeName,
                    passTier.getTierName(),
                    validDate
            );
            String qrSignatureHash = passSecurityService.generateHmacSha256(qrPayload);

            pass.setQrPayload(qrPayload);
            pass.setQrSignatureHash(qrSignatureHash);

            Pass savedPass = passRepository.save(pass);
            createdPasses.add(toPassDto(savedPass));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", savedBooking.getId());
        result.put("bookingReference", savedBooking.getBookingReference());
        result.put("eventId", event.getId());
        result.put("eventTitle", event.getTitle());
        result.put("totalAmount", savedBooking.getTotalAmount());
        result.put("bookingStatus", savedBooking.getBookingStatus());
        result.put("createdAt", savedBooking.getCreatedAt().toString());
        result.put("passes", createdPasses);

        return result;
    }

    public Map<String, Object> getBookingById(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        return toBookingDto(booking);
    }

    public List<Map<String, Object>> getPassesByEmailOrUser(String email) {
        if (email == null) return Collections.emptyList();
        List<Pass> passes = passRepository.findByAttendeeEmail(email.trim().toLowerCase());
        Optional<User> user = userRepository.findByEmail(email.trim().toLowerCase());
        if (user.isPresent()) {
            List<Pass> userPasses = passRepository.findByUserId(user.get().getId());
            Set<String> seenIds = new HashSet<>();
            List<Pass> combined = new ArrayList<>();
            for (Pass p : passes) {
                if (seenIds.add(p.getId())) combined.add(p);
            }
            for (Pass p : userPasses) {
                if (seenIds.add(p.getId())) combined.add(p);
            }
            passes = combined;
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Pass p : passes) {
            result.add(toPassDto(p));
        }
        return result;
    }

    public Map<String, Object> getPassById(String passId) {
        Pass pass = passRepository.findById(passId)
                .or(() -> passRepository.findByPassNumber(passId))
                .or(() -> passRepository.findByQrSignatureHash(passId))
                .orElseThrow(() -> new IllegalArgumentException("Pass not found"));
        return toPassDto(pass);
    }

    public List<Map<String, Object>> listAllPasses(int skip, int limit) {
        List<Pass> passes = passRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        int start = Math.min(skip, passes.size());
        int end = Math.min(start + limit, passes.size());
        for (int i = start; i < end; i++) {
            result.add(toPassDto(passes.get(i)));
        }
        return result;
    }

    public Map<String, Object> toPassDto(Pass pass) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", pass.getId());
        dto.put("passNumber", pass.getPassNumber());
        dto.put("bookingId", pass.getBookingId());
        dto.put("attendeeName", pass.getAttendeeName());
        dto.put("attendeeEmail", pass.getAttendeeEmail());
        dto.put("attendeePhone", pass.getAttendeePhone());
        dto.put("tierName", pass.getTierName());
        dto.put("status", pass.getStatus());
        dto.put("entryCount", pass.getEntryCount());
        dto.put("maxEntries", pass.getMaxEntries());
        dto.put("lastScannedAt", pass.getLastScannedAt() != null ? pass.getLastScannedAt().toString() : null);
        dto.put("qrPayload", pass.getQrPayload());
        dto.put("qrSignatureHash", pass.getQrSignatureHash());
        dto.put("createdAt", pass.getCreatedAt().toString());
        return dto;
    }

    public Map<String, Object> toBookingDto(Booking booking) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", booking.getId());
        dto.put("bookingReference", booking.getBookingReference());
        dto.put("totalAmount", booking.getTotalAmount());
        dto.put("bookingStatus", booking.getBookingStatus());
        dto.put("createdAt", booking.getCreatedAt().toString());
        List<Map<String, Object>> passDtos = new ArrayList<>();
        if (booking.getPasses() != null) {
            for (Pass p : booking.getPasses()) {
                passDtos.add(toPassDto(p));
            }
        }
        dto.put("passes", passDtos);
        return dto;
    }
}
