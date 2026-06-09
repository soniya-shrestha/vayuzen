package com.example.vayuZen.dto;

import com.example.vayuZen.entity.User;
import com.example.vayuZen.validation.PasswordMatches;
import lombok.Data;
import jakarta.validation.constraints.*;


@PasswordMatches
@Data
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @Email(message = "Please provide a valid email")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(
            regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).{8,}$",
            message = "Password must include uppercase, lowercase, number and special character"
    )
    private String password;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;

    @NotNull(message = "Age group is required")
    private User.AgeGroup ageGroup;

    @NotNull(message = "Health condition is required")
    private User.HealthCondition healthCondition;
}
