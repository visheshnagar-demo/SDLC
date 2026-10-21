package com.gms.repository;

import com.gms.model.PassTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PassTierRepository extends JpaRepository<PassTier, String> {
    List<PassTier> findByEventId(String eventId);
}
