package com.sportstalent.backend.repository;

import com.sportstalent.backend.entity.SportDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SportDefinitionRepository extends JpaRepository<SportDefinition, Long> {
    Optional<SportDefinition> findBySlugIgnoreCase(String slug);
    Optional<SportDefinition> findByNameIgnoreCase(String name);
    List<SportDefinition> findByActiveTrueOrderByNameAsc();
}
