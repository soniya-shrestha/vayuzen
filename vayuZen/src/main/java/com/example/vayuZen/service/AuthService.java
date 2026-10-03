package com.example.vayuZen.service;


import com.example.vayuZen.dto.AuthResponse;
import com.example.vayuZen.dto.LoginRequest;
import com.example.vayuZen.dto.RegisterRequest;
import com.example.vayuZen.entity.User;
import com.example.vayuZen.repository.UserRepository;
import com.example.vayuZen.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    // ─── Register ─────────────────────────────────────────────────────────────

    public AuthResponse register(RegisterRequest request) {

        // Check if email is already taken
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered");
        }

        // Build the User object
        // Notice: we hash the password with BCrypt — NEVER store plain text
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .ageGroup(request.getAgeGroup())
                .healthCondition(request.getHealthCondition())
                .role(User.Role.USER)
                .build();

        // Save to database
        userRepository.save(user);

        // Generate a JWT token for the new user
        String token = jwtService.generateToken(user);

        // Return the token + user info to Angular
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .ageGroup(user.getAgeGroup())
                .healthCondition(user.getHealthCondition())
                .message("Registration successful")
                .build();
    }

    // ─── Login ────────────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request) {

        // This line does two things:
        // 1. Loads the user by email from the database
        // 2. Checks if the password matches the stored BCrypt hash
        // If either fails, it throws an exception automatically
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // If we reach here, credentials were correct — load the user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate a fresh JWT token
        String token = jwtService.generateToken(user);

        // Return the token + user info to Angular
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .ageGroup(user.getAgeGroup())
                .healthCondition(user.getHealthCondition())
                .message("Login successful")
                .build();
    }
}
