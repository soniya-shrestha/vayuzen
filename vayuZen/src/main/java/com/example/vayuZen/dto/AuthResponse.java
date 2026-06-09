package com.example.vayuZen.dto;

import com.example.vayuZen.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;           // JWT token — Angular stores this and sends it with every request
    private String email;
    private String fullName;
    private User.AgeGroup ageGroup;
    private User.HealthCondition healthCondition;
    private String message;         // e.g. "Login successful"
}
