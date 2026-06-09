package com.example.vayuZen.validation;

import com.example.vayuZen.dto.RegisterRequest;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordMatchValidator  implements ConstraintValidator<PasswordMatches, RegisterRequest> {

    @Override
    public boolean isValid(RegisterRequest request,
                           ConstraintValidatorContext context) {

        return request.getPassword() != null &&
                request.getPassword().equals(request.getConfirmPassword());
    }
}
