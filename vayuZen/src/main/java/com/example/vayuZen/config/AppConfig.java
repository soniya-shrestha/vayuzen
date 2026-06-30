package com.example.vayuZen.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    // RestTemplate is what Spring uses to make HTTP calls to external APIs.
    // We register it as a @Bean so AqiService can inject it via constructor.
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
