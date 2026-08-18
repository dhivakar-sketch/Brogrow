package com.sportstalent.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "athlete_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AthleteProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String athleteName;

    @Column(nullable = false)
    private LocalDate dateOfBirth;

    @Column(nullable = false)
    private String gender;

    @Column(nullable = false)
    private String location;

    @Column
    private Integer age;

    @Column
    private Double heightCm;

    @Column
    private Double weightKg;

    @Column
    private String primarySport;

    @Column
    private String secondarySport;

    @Column
    private String playingPosition;

    @Column
    private String skillLevel;

    @Column
    private Integer yearsOfTraining;

    @Column
    private String coachName;

    @Column
    private String academyName;

    @Column
    private String phoneNumber;

    @Column
    private String emergencyContact;

    @Column
    private boolean privacyEnabled = true;
}
