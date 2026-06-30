package com.example.vayuZen.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// This is the JSON body Spring Boot sends to Flask /predict
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionRequest {
    private double pm25;
    private double pm10;
    private double no2;
    private double aqi;
    private String age_group;        // e.g. "ADULT"
    private String health_condition; // e.g. "ASTHMA"
}
