package com.example.vayuZen.service;
import com.example.vayuZen.dto.PredictionRequest;
import com.example.vayuZen.dto.PredictionResponse;
import com.example.vayuZen.dto.Recommendation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MlService {

    private final RestTemplate restTemplate;

    // Flask microservice URL — running on port 5000
    private static final String FLASK_URL = "http://localhost:5000/predict";

    public PredictionResponse predict(
            double pm25, double pm10, double no2, double aqi,
            String ageGroup, String healthCondition
    ) {
        try {
            // Build the request body to send to Flask
            PredictionRequest request = PredictionRequest.builder()
                    .pm25(pm25)
                    .pm10(pm10)
                    .no2(no2)
                    .aqi(aqi)
                    .age_group(ageGroup)
                    .health_condition(healthCondition)
                    .build();

            log.info("Calling Flask ML: AQI={}, PM2.5={}, {}, {}", aqi, pm25, ageGroup, healthCondition);

            // POST to Flask and get prediction back
            PredictionResponse response = restTemplate.postForObject(
                    FLASK_URL,
                    request,
                    PredictionResponse.class
            );

            if (response != null) {
                log.info("ML prediction: {} (confidence: {}, {} recommendations)",
                        response.getRisk_level(), response.getConfidence(),
                        response.getRecommendations() != null ? response.getRecommendations().size() : 0);
                return response;
            }

        } catch (Exception e) {
            // If Flask is down, fall back gracefully — don't crash the whole app
            log.warn("Flask ML service unavailable: {}. Using rule-based fallback.", e.getMessage());
        }

        // Fallback: simple rule-based prediction if Flask is unreachable
        return fallbackPrediction(aqi, ageGroup, healthCondition);
    }

    // Rule-based fallback — used only if Flask is down
    private PredictionResponse fallbackPrediction(double aqi, String ageGroup, String healthCondition) {
        String risk;
        boolean vulnerable = ageGroup.equals("ELDERLY") || ageGroup.equals("CHILD")
                || healthCondition.equals("ASTHMA") || healthCondition.equals("RESPIRATORY")
                || healthCondition.equals("HEART_DISEASE");

        if (aqi <= 100) risk = vulnerable ? "Moderate" : "Low";
        else if (aqi <= 200) risk = vulnerable ? "High" : "Moderate";
        else if (aqi <= 300) risk = vulnerable ? "Very High" : "High";
        else risk = "Very High";

        List<Recommendation> fallbackRecs = List.of(
                Recommendation.builder()
                        .color("#718096").icon("⚡")
                        .title("Limited connectivity")
                        .body("Showing rule-based guidance — the AI prediction service is temporarily unavailable.")
                        .build(),
                Recommendation.builder()
                        .color("#38A169").icon("💧")
                        .title("Stay hydrated")
                        .body("Drinking water helps your body manage the effects of air pollution.")
                        .build()
        );

        return PredictionResponse.builder()
                .risk_level(risk)
                .confidence(0.75)
                .probabilities(null)
                .recommendations(fallbackRecs)
                .build();
    }
}

