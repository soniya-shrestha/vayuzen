package com.example.vayuZen.controller;

import com.example.vayuZen.dto.AuthResponse;
import com.example.vayuZen.dto.LoginRequest;
import com.example.vayuZen.dto.RegisterRequest;
import com.example.vayuZen.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ─── POST /api/auth/register ──────────────────────────────────────────────
    // Angular calls this when user fills in the register form
    // @Valid triggers the validation annotations in RegisterRequest (@NotBlank etc.)
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            // 201 Created = new resource was created successfully
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            // e.g. "Email is already registered"
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)       // 409 Conflict
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // ─── POST /api/auth/login ─────────────────────────────────────────────────
    // Angular calls this when user fills in the login form
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);   // 200 OK
        } catch (Exception e) {
            // Wrong email or password
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)   // 401
                    .body(Map.of("message", "Invalid email or password"));
        }
    }

    // ─── GET /api/auth/health ─────────────────────────────────────────────────
    // Quick endpoint to confirm the backend is running
    // Hit this in browser: http://localhost:8080/api/auth/health
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "VayuZen backend is running ✅",
                "version", "1.0.0"
        ));
    }
}
