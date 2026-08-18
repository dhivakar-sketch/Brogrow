package com.sportstalent.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "athlete_id", nullable = false)
    private AthleteProfile athlete;

    @ManyToOne
    @JoinColumn(name = "coach_id")
    private Coach coach;

    @Column(nullable = false)
    private String reportType;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String reportData;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime generatedAt = LocalDateTime.now();
}
