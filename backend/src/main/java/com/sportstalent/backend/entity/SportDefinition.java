package com.sportstalent.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "sport_definitions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "assessment_categories", columnDefinition = "TEXT")
    private String assessmentCategories;

    @Column(name = "skill_categories", columnDefinition = "TEXT")
    private String skillCategories;

    @Column(name = "dashboard_labels", columnDefinition = "TEXT")
    private String dashboardLabels;

    @Column(name = "strength_signals", columnDefinition = "TEXT")
    private String strengthSignals;

    @Column(name = "growth_signals", columnDefinition = "TEXT")
    private String growthSignals;

    @Column(name = "recommendation_templates", columnDefinition = "TEXT")
    private String recommendationTemplates;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
