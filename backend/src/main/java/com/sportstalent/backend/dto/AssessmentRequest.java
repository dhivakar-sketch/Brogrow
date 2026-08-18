package com.sportstalent.backend.dto;

import java.util.Map;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssessmentRequest {

    @NotBlank(message = "sport is required")
    private String sport;

    @NotBlank(message = "category is required")
    private String category;

    @NotNull(message = "score is required")
    private Double score;

    @NotNull(message = "weightedScore is required")
    private Double weightedScore;

    private String notes;
    private String benchmarkLabel;
    private Double benchmarkScore;
    private Map<String, Double> metrics;
}
