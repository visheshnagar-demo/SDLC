package com.gms;

import com.gms.model.Event;
import com.gms.model.PassTier;
import com.gms.model.User;
import com.gms.repository.EventRepository;
import com.gms.repository.PassTierRepository;
import com.gms.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;

@SpringBootApplication
public class GmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(GmsApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedData(UserRepository userRepository,
                                      EventRepository eventRepository,
                                      PassTierRepository passTierRepository,
                                      PasswordEncoder passwordEncoder) {
        return args -> {
            // Seed Users idempotently
            if (userRepository.findByEmail("test@example.com").isEmpty()) {
                User testUser = new User("test@example.com", passwordEncoder.encode("testpassword"), "Aarav Patel", "+14155550199", "ATTENDEE");
                userRepository.save(testUser);
            }

            if (userRepository.findByEmail("admin@example.com").isEmpty()) {
                User adminUser = new User("admin@example.com", passwordEncoder.encode("adminpassword"), "Event Admin", "+14155550100", "EVENT_ADMIN");
                userRepository.save(adminUser);
            }

            if (userRepository.findByEmail("security@example.com").isEmpty()) {
                User securityUser = new User("security@example.com", passwordEncoder.encode("securitypassword"), "Gate Officer Sharma", "+14155550111", "GATE_SECURITY");
                userRepository.save(securityUser);
            }

            // Seed Events and Pass Tiers
            if (eventRepository.count() == 0) {
                Event garbaEvent = new Event(
                        "GarbaFest 2026 - Navratri Grand Celebration",
                        "Experience the vibrant rhythms of Navratri with world-class Dandiya & Garba artists, grand stage production, and authentic Gujarati food stalls.",
                        "Grand Arena Bay Pavilion, Gate 1-4, San Jose, CA",
                        LocalDate.now().plusDays(10),
                        LocalDate.now().plusDays(19),
                        "ACTIVE"
                );
                Event savedEvent = eventRepository.save(garbaEvent);

                PassTier singleDay = new PassTier(
                        savedEvent,
                        "Single-Day Pass",
                        "General access to any single night of the 9-day festival.",
                        new BigDecimal("25.00"),
                        2000,
                        1850,
                        LocalDate.now().plusDays(10),
                        LocalDate.now().plusDays(19)
                );
                passTierRepository.save(singleDay);

                PassTier seasonPass = new PassTier(
                        savedEvent,
                        "Season Pass (All 9 Nights)",
                        "Full unlimited access to all 9 nights of GarbaFest 2026.",
                        new BigDecimal("150.00"),
                        1500,
                        1200,
                        LocalDate.now().plusDays(10),
                        LocalDate.now().plusDays(19)
                );
                passTierRepository.save(seasonPass);

                PassTier vipPass = new PassTier(
                        savedEvent,
                        "VIP Pass (All Access & Lounge)",
                        "Priority gate entry, VIP lounge hospitality, complimentary dandiya sticks, and premium parking.",
                        new BigDecimal("300.00"),
                        500,
                        380,
                        LocalDate.now().plusDays(10),
                        LocalDate.now().plusDays(19)
                );
                passTierRepository.save(vipPass);
            }
        };
    }
}
