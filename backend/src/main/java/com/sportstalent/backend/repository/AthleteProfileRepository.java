package com.sportstalent.backend.repository;

import com.sportstalent.backend.entity.AthleteProfile;
import com.sportstalent.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AthleteProfileRepository extends JpaRepository<AthleteProfile, Long> {
    Optional<AthleteProfile> findByUser(User user);
    Optional<AthleteProfile> findByUserId(Long userId);
}
