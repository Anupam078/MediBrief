package com.medibrief.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Flag {
    private String type; // ALLERGY, CHRONIC_DISEASE, ACUTE_EVENT, PAST_PROCEDURE, MEDICATION_NOTE
    private String entity;
    private String severity; // HIGH, MEDIUM, LOW
    private String reason;
    private String confidence; // HIGH, MEDIUM, LOW
    private String sourceId;
}
