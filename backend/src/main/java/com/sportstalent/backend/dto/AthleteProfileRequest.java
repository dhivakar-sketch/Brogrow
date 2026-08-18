package com.sportstalent.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AthleteProfileRequest {

    @NotBlank
    private String athleteName;

    @NotNull
    private LocalDate dateOfBirth;

    @NotBlank
    private String gender;

    @NotBlank
    private String location;

    private Integer age;
    private Double heightCm;
    private Double weightKg;
    private String primarySport;
    private String secondarySport;
    private String playingPosition;
    private String skillLevel;
    private Integer yearsOfTraining;
    private String coachName;
    private String academyName;
    private String phoneNumber;
    private String emergencyContact;
    private boolean privacyEnabled = true;
}
