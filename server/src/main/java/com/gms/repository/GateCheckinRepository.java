package com.gms.repository;

import com.gms.model.GateCheckin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GateCheckinRepository extends JpaRepository<GateCheckin, String> {
    List<GateCheckin> findByPassIdOrderByScanTimestampDesc(String passId);
    long countByScanResult(String scanResult);

    @Query("SELECT g.gateIdentifier, COUNT(g) FROM GateCheckin g WHERE g.scanResult = 'SUCCESS' GROUP BY g.gateIdentifier")
    List<Object[]> countSuccessCheckinsByGate();
}
