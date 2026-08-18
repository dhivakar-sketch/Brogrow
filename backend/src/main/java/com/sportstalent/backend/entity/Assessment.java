package com.sportstalent.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "assessments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String sport;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssessmentCategory category;

    @Column(nullable = false)
    private Double score;

    @Column(nullable = false)
    private Double weightedScore;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime assessedAt = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String metricsJson;

    @Column
    private String benchmarkLabel;

    @Column
    private Double benchmarkScore;

    @Column
    private boolean coachVerified = false;
}
