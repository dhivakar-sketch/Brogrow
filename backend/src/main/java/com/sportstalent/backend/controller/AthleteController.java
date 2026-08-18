package com.sportstalent.backend.controller;

import com.sportstalent.backend.dto.AthleteProfileRequest;
import com.sportstalent.backend.entity.AthleteProfile;
import com.sportstalent.backend.service.AthleteProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/athletes")
public class AthleteController {

    private final AthleteProfileService athleteProfileService;

    public AthleteController(AthleteProfileService athleteProfileService) {
        this.athleteProfileService = athleteProfileService;
    }

    @PostMapping("/profile")
    public ResponseEntity<AthleteProfile> createOrUpdateProfile(
            Authentication authentication,
            @Valid @RequestBody AthleteProfileRequest request) {

        String email = authentication.getName();
        return ResponseEntity.ok(athleteProfileService.createOrUpdateProfile(email, request));
    }

    @GetMapping("/profile")
    public ResponseEntity<AthleteProfile> getProfile(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(athleteProfileService.getProfile(email));
    }
}
