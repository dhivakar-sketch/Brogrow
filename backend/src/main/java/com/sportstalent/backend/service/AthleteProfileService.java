package com.sportstalent.backend.service;

import com.sportstalent.backend.dto.AthleteProfileRequest;
import com.sportstalent.backend.entity.AthleteProfile;
import com.sportstalent.backend.entity.User;
import com.sportstalent.backend.repository.AthleteProfileRepository;
import com.sportstalent.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class AthleteProfileService {

    private final AthleteProfileRepository athleteProfileRepository;
    private final UserRepository userRepository;

    public AthleteProfileService(AthleteProfileRepository athleteProfileRepository,
                                UserRepository userRepository) {
        this.athleteProfileRepository = athleteProfileRepository;
        this.userRepository = userRepository;
    }

    public AthleteProfile createOrUpdateProfile(String email, AthleteProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        AthleteProfile profile = athleteProfileRepository.findByUser(user)
                .orElse(new AthleteProfile());

        profile.setUser(user);
        profile.setAthleteName(request.getAthleteName());
        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setGender(request.getGender());
        profile.setLocation(request.getLocation());
        profile.setAge(request.getAge());
        profile.setHeightCm(request.getHeightCm());
        profile.setWeightKg(request.getWeightKg());
        profile.setPrimarySport(request.getPrimarySport());
        profile.setSecondarySport(request.getSecondarySport());
        profile.setPlayingPosition(request.getPlayingPosition());
        profile.setSkillLevel(request.getSkillLevel());
        profile.setYearsOfTraining(request.getYearsOfTraining());
        profile.setCoachName(request.getCoachName());
        profile.setAcademyName(request.getAcademyName());
        profile.setPhoneNumber(request.getPhoneNumber());
        profile.setEmergencyContact(request.getEmergencyContact());
        profile.setPrivacyEnabled(request.isPrivacyEnabled());

        return athleteProfileRepository.save(profile);
    }

    public AthleteProfile getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return athleteProfileRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Athlete profile not found"));
    }
}
