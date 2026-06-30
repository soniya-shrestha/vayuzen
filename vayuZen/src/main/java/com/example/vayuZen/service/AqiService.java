package com.example.vayuZen.service;

import com.example.vayuZen.dto.AqiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AqiService {

    private final RestTemplate restTemplate;

    // Kathmandu coordinates
    private static final double LAT = 27.7172;
    private static final double LON = 85.3240;

    // Open-Meteo Air Quality API — completely free, no API key needed
    private static final String OPEN_METEO_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

    public AqiResponse getCurrentAqi() {
        try {
            // Build the API URL with all the pollutants we want
            // Open-Meteo returns hourly data — we take the most recent value
            String url = UriComponentsBuilder.fromHttpUrl(OPEN_METEO_URL)
                    .queryParam("latitude",  LAT)
                    .queryParam("longitude", LON)
                    .queryParam("hourly", "pm10,pm2_5,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide,european_aqi")
                    .queryParam("timezone", "Asia/Kathmandu")
                    .queryParam("forecast_days", 1)
                    .toUriString();

            log.info("Fetching AQI from Open-Meteo: {}", url);

            // Call the API — returns a nested JSON map
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response == null) {
                log.error("Empty response from Open-Meteo");
                return fallbackData();
            }

            // Extract the hourly data block
            Map<String, Object> hourly = (Map<String, Object>) response.get("hourly");

            if (hourly == null) {
                log.error("No hourly data in Open-Meteo response");
                return fallbackData();
            }

            // Get the most recent non-null reading for each pollutant
            double pm25 = getLatestValue(hourly, "pm2_5");
            double pm10 = getLatestValue(hourly, "pm10");
            double no2  = getLatestValue(hourly, "nitrogen_dioxide");
            double so2  = getLatestValue(hourly, "sulphur_dioxide");
            double o3   = getLatestValue(hourly, "ozone");
            double co   = getLatestValue(hourly, "carbon_monoxide");
            int    aqi  = (int) getLatestValue(hourly, "european_aqi");

            // Determine level from AQI value (European AQI scale)
            String level       = calculateLevel(aqi);
            String description = buildDescription(level, pm25);
            String updatedAt   = LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("hh:mm a"));

            log.info("AQI fetched successfully: AQI={}, PM2.5={}, Level={}", aqi, pm25, level);

            return AqiResponse.builder()
                    .aqi(aqi)
                    .pm25(round(pm25))
                    .pm10(round(pm10))
                    .no2(round(no2))
                    .so2(round(so2))
                    .o3(round(o3))
                    .co(round(co))
                    .level(level)
                    .description(description)
                    .updatedAt(updatedAt)
                    .location("Kathmandu, Nepal")
                    .latitude(LAT)
                    .longitude(LON)
                    .build();

        } catch (Exception e) {
            log.error("Failed to fetch AQI from Open-Meteo: {}", e.getMessage());
            return fallbackData();
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    // Open-Meteo returns arrays of hourly values.
    // We walk backwards to get the most recent non-null value.
    private double getLatestValue(Map<String, Object> hourly, String key) {
        Object raw = hourly.get(key);
        if (raw == null) return 0.0;

        java.util.List<?> values = (java.util.List<?>) raw;

        // Walk backwards — latest reading first
        for (int i = values.size() - 1; i >= 0; i--) {
            Object val = values.get(i);
            if (val != null) {
                if (val instanceof Number) {
                    return ((Number) val).doubleValue();
                }
            }
        }
        return 0.0;
    }

    // European AQI scale (used by Open-Meteo)
    // 0–20 = Good, 21–40 = Fair, 41–60 = Moderate, 61–80 = Poor, 81–100 = Very Poor, >100 = Extremely Poor
    private String calculateLevel(int aqi) {
        if (aqi <= 20)  return "Low";
        if (aqi <= 60)  return "Moderate";
        if (aqi <= 100) return "High";
        return "Very High";
    }

    private String buildDescription(String level, double pm25) {
        return switch (level) {
            case "Low"       -> "Air quality is good. Safe for all activities including outdoor exercise.";
            case "Moderate"  -> "Air quality is acceptable. Unusually sensitive people may experience minor effects.";
            case "High"      -> "Unhealthy for sensitive groups. People with asthma or heart conditions should limit outdoor exposure.";
            case "Very High" -> "Very unhealthy. Avoid all outdoor activities. Stay indoors with windows closed.";
            default          -> "Air quality data available.";
        };
    }

    private double round(double val) {
        return Math.round(val * 10.0) / 10.0;
    }

    // Returned if the API call fails — so the app never crashes
    private AqiResponse fallbackData() {
        return AqiResponse.builder()
                .aqi(0)
                .pm25(0).pm10(0).no2(0).so2(0).o3(0).co(0)
                .level("Unknown")
                .description("Unable to fetch air quality data. Please try again.")
                .updatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("hh:mm a")))
                .location("Kathmandu, Nepal")
                .latitude(LAT)
                .longitude(LON)
                .build();
    }
}
