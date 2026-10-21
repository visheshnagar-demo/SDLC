package com.gms.repository;

import com.gms.model.Pass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PassRepository extends JpaRepository<Pass, String> {
    List<Pass> findByBookingId(String bookingId);
    Optional<Pass> findByPassNumber(String passNumber);
    Optional<Pass> findByQrSignatureHash(String qrSignatureHash);

    @Query("SELECT p FROM Pass p JOIN p.booking b WHERE b.user.id = :userId")
    List<Pass> findByUserId(@Param("userId") String userId);

    @Query("SELECT p FROM Pass p WHERE p.attendeeEmail = :email")
    List<Pass> findByAttendeeEmail(@Param("email") String email);
}
