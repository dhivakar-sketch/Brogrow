package com.sportstalent.backend.repository;

import com.sportstalent.backend.entity.Assessment;
import com.sportstalent.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findByUserOrderByAssessedAtDesc(User user);
    List<Assessment> findByUserAndSportOrderByAssessedAtDesc(User user, String sport);
}
