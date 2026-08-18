package com.sportstalent.backend.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class SportCatalogConfig {

    private SportCatalogConfig() {
    }

    public static final List<Map<String, Object>> DEFAULT_SPORTS = buildDefaultSports();

    public static List<Map<String, Object>> buildDefaultSports() {
        List<Map<String, Object>> sports = new ArrayList<>();

        sports.add(buildSport(
                "cricket",
                "Cricket",
                "Batting, bowling, fielding and movement quality in match-like conditions.",
                List.of("Batting", "Bowling", "Fielding", "Fitness", "Overall"),
                List.of("Batting", "Bowling", "Fielding", "Mobility", "Decision making"),
                Map.of("overall", "Overall score", "trend", "Performance trend", "summary", "Talent insight"),
                List.of("Explosive acceleration", "Decision speed under pressure", "Technical repeatability"),
                List.of("Footwork under pressure", "Consistency in high-intensity phases", "Strike rotation and control"),
                List.of(
                        "Continue technical repetition with live match-pressure drills.",
                        "Prioritise explosive acceleration and footwork quality in training blocks.",
                        "Reassess after 6–8 weeks to monitor gains in all-round match impact."
                ),
                buildMetrics(
                        "battingAverage", "Batting Average", 10, 80, 0.25, false,
                        "strikeRate", "Strike Rate", 40, 160, 0.15, false,
                        "bowlingEconomy", "Bowling Economy", 3.0, 12.0, 0.15, true,
                        "fieldingReflexScore", "Fielding Reflex Score", 40, 100, 0.20, false,
                        "sprintTime30m", "30m Sprint Time", 3.5, 6.0, 0.15, true,
                        "coordinationScore", "Coordination Score", 40, 100, 0.10, false
                )
        ));

        sports.add(buildSport(
                "football",
                "Football",
                "Movement economy, technical execution and game intelligence for field play.",
                List.of("Speed", "Technique", "Fitness", "Decision making", "Overall"),
                List.of("Acceleration", "Passing", "Ball control", "Agility", "Game understanding"),
                Map.of("overall", "Overall score", "trend", "Performance trend", "summary", "Talent insight"),
                List.of("Explosive acceleration", "Passing precision", "High-speed recovery"),
                List.of("First touch quality", "Decision speed in transition", "Repeated sprint ability"),
                List.of(
                        "Prioritise short-passing combinations and transition drills.",
                        "Build repeat sprint capacity and first-touch control under fatigue.",
                        "Re-test after 6 weeks to validate technical and tactical gains."
                ),
                buildMetrics(
                        "sprintTime40m", "40m Sprint Time", 4.5, 7.5, 0.20, true,
                        "yo2VO2Max", "VO₂ Max (Yo-Yo)", 35, 65, 0.20, false,
                        "passingAccuracy", "Passing Accuracy", 40, 95, 0.20, false,
                        "shotPowerScore", "Shot Power Score", 40, 100, 0.15, false,
                        "agilityTTest", "Agility T-Test", 8.5, 14.0, 0.15, true,
                        "ballControlScore", "Ball Control Score", 40, 100, 0.10, false
                )
        ));

        sports.add(buildSport(
                "basketball",
                "Basketball",
                "Explosive power, shooting efficiency and court awareness for playing speed.",
                List.of("Athleticism", "Shooting", "Movement", "Decision making", "Overall"),
                List.of("Jumping", "Shooting", "Defensive reads", "Ball handling", "Court vision"),
                Map.of("overall", "Overall score", "trend", "Performance trend", "summary", "Talent insight"),
                List.of("Vertical explosiveness", "Shot consistency", "Defensive anticipation"),
                List.of("Transition decision speed", "Close-out timing", "Finishing under pressure"),
                List.of(
                        "Increase explosive lower-body training and finishing drills.",
                        "Prioritise shooting repetition under fatigue and defensive pressure.",
                        "Review court-vision decisions after each training block."
                ),
                buildMetrics(
                        "verticalJumpCm", "Vertical Jump", 30, 80, 0.20, false,
                        "sprintTime20m", "20m Sprint Time", 2.8, 4.5, 0.15, true,
                        "freeThrowPct", "Free Throw %", 30, 90, 0.20, false,
                        "threePtShootingPct", "3-Point Shooting %", 15, 55, 0.15, false,
                        "agilityScore", "Agility Score", 40, 100, 0.15, false,
                        "courtVision", "Court Vision Score", 40, 100, 0.15, false
                )
        ));

        sports.add(buildSport(
                "athletics",
                "Athletics",
                "Linear speed, power, and endurance qualities for track and field performance.",
                List.of("Speed", "Power", "Endurance", "Reaction", "Overall"),
                List.of("Acceleration", "Explosive power", "Endurance", "Reaction time", "Technique"),
                Map.of("overall", "Overall score", "trend", "Performance trend", "summary", "Talent insight"),
                List.of("Acceleration quality", "Explosive power", "Technical efficiency"),
                List.of("Reaction time discipline", "Speed maintenance", "Power transfer"),
                List.of(
                        "Maintain a technical block focused on start mechanics and rhythm.",
                        "Build conditioned power and reaction training to support race output.",
                        "Use periodic re-tests to verify speed and power development."
                ),
                buildMetrics(
                        "sprint100m", "100m Sprint Time", 10.0, 16.0, 0.30, true,
                        "longJumpM", "Long Jump", 3.0, 7.5, 0.20, false,
                        "shotPutM", "Shot Put Distance", 4.0, 16.0, 0.15, false,
                        "endurance1500m", "1500m Time", 240, 540, 0.20, true,
                        "reactionTimeMs", "Reaction Time", 100, 280, 0.15, true
                )
        ));

        sports.add(buildSport(
                "volleyball",
                "Volleyball",
                "Explosive jumping, serving precision and court reaction quality.",
                List.of("Power", "Serve", "Reaction", "Defence", "Overall"),
                List.of("Jumping", "Serving", "Blocking", "Reaction", "Court coverage"),
                Map.of("overall", "Overall score", "trend", "Performance trend", "summary", "Talent insight"),
                List.of("Vertical explosiveness", "Serving consistency", "Court reaction timing"),
                List.of("Blocking timing", "Serve precision", "Defensive reads"),
                List.of(
                        "Continue jump training alongside serve targeting drills.",
                        "Improve blocking timing and court coverage under faster service tempos.",
                        "Use six-week blocks to track progress in jumping and reaction quality."
                ),
                buildMetrics(
                        "verticalJumpCm", "Vertical Jump", 30, 75, 0.25, false,
                        "spikeSpeedKmh", "Spike Speed", 40, 120, 0.20, false,
                        "servingAccuracy", "Serving Accuracy", 30, 95, 0.20, false,
                        "reactionTimeMs", "Reaction Time", 100, 300, 0.15, true,
                        "blockingScore", "Blocking Score", 40, 100, 0.20, false
                )
        ));

        sports.add(buildSport(
                "tennis",
                "Tennis",
                "Speed, reaction, shot consistency and court movement for multi-directional play.",
                List.of("Movement", "Technique", "Power", "Reaction", "Overall"),
                List.of("Footwork", "Serve accuracy", "Groundstroke control", "Court coverage", "Decision making"),
                Map.of("overall", "Overall score", "trend", "Performance trend", "summary", "Talent insight"),
                List.of("Court coverage", "Serve placement", "Reactive recovery"),
                List.of("Footwork efficiency", "Shot selection under pressure", "First-strike quality"),
                List.of(
                        "Prioritise footwork and split-step timing to improve first-step speed.",
                        "Increase rally consistency and unforced error reduction in training blocks.",
                        "Reassess after 6 weeks to assess serve and movement gains."
                ),
                buildMetrics(
                        "serveSpeedKmh", "Serve Speed", 60, 180, 0.20, false,
                        "firstServePct", "First Serve %", 40, 90, 0.20, false,
                        "courtMovementScore", "Court Movement Score", 40, 100, 0.20, false,
                        "reactionTimeMs", "Reaction Time", 150, 500, 0.15, true,
                        "rallyConsistency", "Rally Consistency", 40, 100, 0.15, false,
                        "agilityScore", "Agility Score", 40, 100, 0.10, false
                )
        ));

        sports.add(buildSport(
                "hockey",
                "Hockey",
                "Speed, ball control, stick skill and game transition quality.",
                List.of("Speed", "Technique", "Fitness", "Tactical awareness", "Overall"),
                List.of("Stick control", "Passing", "Acceleration", "Defensive reads", "Game sense"),
                Map.of("overall", "Overall score", "trend", "Performance trend", "summary", "Talent insight"),
                List.of("Stick control", "Acceleration", "Passing accuracy"),
                List.of("Pace in transition", "Defensive positioning", "Reception under pressure"),
                List.of(
                        "Improve first-touch control under high tempo and limited space.",
                        "Focus on concise passing patterns and acceleration into support positions.",
                        "Review defensive compactness and transition speed after each block."
                ),
                buildMetrics(
                        "sprint30m", "30m Sprint Time", 3.8, 6.5, 0.20, true,
                        "stickControlScore", "Stick Control Score", 40, 100, 0.20, false,
                        "passingAccuracy", "Passing Accuracy", 40, 95, 0.20, false,
                        "agilityScore", "Agility Score", 40, 100, 0.15, false,
                        "enduranceScore", "Endurance Score", 40, 100, 0.15, false,
                        "reactionTimeMs", "Reaction Time", 120, 420, 0.10, true
                )
        ));

        sports.add(buildSport(
                "swimming",
                "Swimming",
                "Stroke efficiency, turn quality, endurance and race pace for event performance.",
                List.of("Technique", "Endurance", "Power", "Starts", "Overall"),
                List.of("Stroke efficiency", "Turn quality", "Pacing", "Starts", "Endurance"),
                Map.of("overall", "Overall score", "trend", "Performance trend", "summary", "Talent insight"),
                List.of("Stroke rhythm", "Turn quality", "Pacing control"),
                List.of("Underwater timing", "Endurance maintenance", "Breathing efficiency"),
                List.of(
                        "Refine stroke length and rhythm to improve energy efficiency.",
                        "Build turn speed and underwater phase control under race conditions.",
                        "Continue block-based testing to confirm endurance and pacing gains."
                ),
                buildMetrics(
                        "sprint50m", "50m Time", 22.0, 42.0, 0.25, true,
                        "strokeEfficiency", "Stroke Efficiency", 40, 100, 0.20, false,
                        "turnTimeSec", "Turn Time", 1.5, 5.0, 0.15, true,
                        "endurance400m", "400m Time", 240, 540, 0.20, true,
                        "startReactionMs", "Start Reaction Time", 60, 180, 0.10, true,
                        "kickPowerScore", "Kick Power Score", 40, 100, 0.10, false
                )
        ));

        sports.add(buildSport(
                "rugby",
                "Rugby",
                "Power, contact readiness, speed and game intelligence for explosive play phases.",
                List.of("Power", "Speed", "Contact", "Tactical awareness", "Overall"),
                List.of("Contact readiness", "Acceleration", "Passing", "Defensive reads", "Explosive power"),
                Map.of("overall", "Overall score", "trend", "Performance trend", "summary", "Talent insight"),
                List.of("Explosive contact power", "Acceleration", "Pass execution"),
                List.of("Tackling technique", "Decision making under pressure", "Repeat sprint quality"),
                List.of(
                        "Increase repeat-sprint capacity and contact readiness.",
                        "Prioritise quick decision-making in phases around breakdowns and space.",
                        "Use long-duration field sessions to track progress in power and repeated speed."
                ),
                buildMetrics(
                        "sprint40m", "40m Sprint Time", 4.8, 7.5, 0.20, true,
                        "contactPowerScore", "Contact Power Score", 40, 100, 0.20, false,
                        "passingAccuracy", "Passing Accuracy", 40, 95, 0.20, false,
                        "agilityScore", "Agility Score", 40, 100, 0.15, false,
                        "enduranceScore", "Endurance Score", 40, 100, 0.15, false,
                        "tackleEfficiency", "Tackle Efficiency", 40, 100, 0.10, false
                )
        ));

        return sports;
    }

    private static Map<String, Object> buildSport(
            String slug,
            String name,
            String description,
            List<String> assessmentCategories,
            List<String> skillCategories,
            Map<String, String> dashboardLabels,
            List<String> strengthSignals,
            List<String> growthSignals,
            List<String> recommendationTemplates,
            List<Map<String, Object>> metrics
    ) {
        Map<String, Object> sport = new LinkedHashMap<>();
        sport.put("slug", slug);
        sport.put("name", name);
        sport.put("description", description);
        sport.put("assessmentCategories", assessmentCategories);
        sport.put("skillCategories", skillCategories);
        sport.put("dashboardLabels", dashboardLabels);
        sport.put("strengthSignals", strengthSignals);
        sport.put("growthSignals", growthSignals);
        sport.put("recommendationTemplates", recommendationTemplates);
        sport.put("metrics", metrics);
        return sport;
    }

    private static List<Map<String, Object>> buildMetrics(Object... values) {
        List<Map<String, Object>> metrics = new ArrayList<>();
        for (int i = 0; i < values.length; i += 6) {
            Map<String, Object> def = new LinkedHashMap<>();
            def.put("key", values[i]);
            def.put("label", values[i + 1]);
            def.put("min", values[i + 2]);
            def.put("max", values[i + 3]);
            def.put("weight", values[i + 4]);
            def.put("lowerIsBetter", values[i + 5]);
            metrics.add(def);
        }
        return metrics;
    }
}
