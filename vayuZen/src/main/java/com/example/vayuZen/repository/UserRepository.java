package com.example.vayuZen.repository;

import com.example.vayuZen.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Spring Data JPA auto-generates the SQL for this just from the method name
    // SELECT * FROM users WHERE email = ? LIMIT 1
    Optional<User> findByEmail(String email);

    // Check if an email is already registered
    boolean existsByEmail(String email);
}