package com.sportstalent.backend.repository;

import com.sportstalent.backend.entity.TalentInsight;
import com.sportstalent.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TalentInsightRepository extends JpaRepository<TalentInsight, Long> {
    List<TalentInsight> findByUser(User user);
}
