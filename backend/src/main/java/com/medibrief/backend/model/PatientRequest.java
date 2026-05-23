package com.medibrief.backend.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PatientRequest {
    @NotBlank(message = "Text cannot be blank.")
    @Size(min = 20, max = 5000, message = "Input text must be between 20 and 5000 characters.")
    private String text;
}
