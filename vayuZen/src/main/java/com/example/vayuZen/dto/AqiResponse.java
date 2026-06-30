package com.example.vayuZen.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AqiResponse {

    // ─── AQI Data (from Open-Meteo) ───────────────────────────────────────────
    private int aqi;
    private double pm25;
    private double pm10;
    private double no2;
    private double co;
    private double so2;
    private double o3;
    private String level;
    private String description;
    private String updatedAt;
    private String location;
    private double latitude;
    private double longitude;

    // ─── ML Prediction (from Flask) ───────────────────────────────────────────
    private String riskLevel;        // "Low", "Moderate", "High", "Very High"
    private double confidence;       // e.g. 0.87 = 87% confident
    private Map<String, Double> probabilities; // breakdown per risk level
    private boolean mlAvailable;     // false if Flask was unreachable (fallback used)

    // ─── Recommendations (NEW — also from Flask) ──────────────────────────────
    private List<Recommendation> recommendations;
}