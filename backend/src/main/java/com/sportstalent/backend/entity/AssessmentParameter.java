package com.sportstalent.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "assessment_parameters")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentParameter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "session_id", nullable = false)
    private AssessmentSession session;

    @Column(nullable = false)
    private String parameterKey;

    @Column(nullable = false)
    private Double parameterValue;

    @Column
    private String unit;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
