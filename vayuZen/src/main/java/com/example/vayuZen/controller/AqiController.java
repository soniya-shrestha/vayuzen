package com.example.vayuZen.controller;

import com.example.vayuZen.dto.AqiResponse;
import com.example.vayuZen.dto.PredictionResponse;
import com.example.vayuZen.service.AqiService;
import com.example.vayuZen.service.MlService;
import com.example.vayuZen.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AqiController {

    private final AqiService aqiService;
    private final MlService  mlService;

    // GET /api current
    // Spring Security extracts the logged-in user from the JWT automatically
    // via @AuthenticationPrincipal — no need to pass userId in the URL
    @GetMapping("/current")
    public ResponseEntity<AqiResponse> getCurrentAqi(
            @AuthenticationPrincipal User currentUser
    ) {
        // 1. Fetch real AQI from Open-Meteo
        AqiResponse aqiData = aqiService.getCurrentAqi();

        // 2. Get user's health profile from the JWT-authenticated user
        String ageGroup        = currentUser.getAgeGroup().name();
        String healthCondition = currentUser.getHealthCondition().name();

        // 3. Call Flask ML service for personalized risk prediction
        PredictionResponse prediction = mlService.predict(
                aqiData.getPm25(),
                aqiData.getPm10(),
                aqiData.getNo2(),
                aqiData.getAqi(),
                ageGroup,
                healthCondition
        );

        // 4. Attach ML prediction to the AQI response
        aqiData.setRiskLevel(prediction.getRisk_level());
        aqiData.setConfidence(prediction.getConfidence());
        aqiData.setProbabilities(prediction.getProbabilities());
        aqiData.setMlAvailable(prediction.getProbabilities() != null);
        aqiData.setRecommendations(prediction.getRecommendations());

        return ResponseEntity.ok(aqiData);
    }
}
