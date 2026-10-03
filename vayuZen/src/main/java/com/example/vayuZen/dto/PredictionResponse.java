package com.example.vayuZen.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

// This matches exactly what Flask /predict returns
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionResponse {
    private String risk_level;               // "Low", "Moderate", "High", "Very High"
    private double confidence;               // e.g. 0.87
    private Map<String, Double> probabilities; // { "Low": 0.02, "Moderate": 0.11, "High": 0.87 }
    private List<Recommendation> recommendations;
}
