package com.example.vayuZen.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// A single recommendation card — matches what Flask returns
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Recommendation {
    private String color;
    private String icon;
    private String title;
    private String body;
}
