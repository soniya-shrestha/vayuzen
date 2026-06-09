package com.example.vayuZen.config;




import com.example.vayuZen.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF — we're using JWT, not cookies, so CSRF is not needed
                .csrf(AbstractHttpConfigurer::disable)

                // Enable CORS so Angular (running on port 4200) can call our API
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Define which routes are public vs protected
                .authorizeHttpRequests(auth -> auth
                        // Anyone can hit the auth endpoints (register & login)
                        .requestMatchers("/api/auth/**").permitAll()

                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        .requestMatchers("/api/user/**").hasAnyRole("USER", "ADMIN")
                        // Every other endpoint requires a valid JWT
                        .anyRequest().authenticated()
                )

                // Use stateless sessions — no server-side session storage, JWT handles state
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // Use our custom AuthenticationProvider (BCrypt + DB lookup)
                .authenticationProvider(authenticationProvider)

                // Add our JWT filter BEFORE Spring's default username/password filter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // CORS config — allows Angular dev server (port 4200) to call the backend
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow requests from Angular dev and prod origins
        configuration.setAllowedOrigins(List.of(
                "http://localhost:4200",     // Angular dev server
                "http://localhost:80"        // production (if deployed)
        ));

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}