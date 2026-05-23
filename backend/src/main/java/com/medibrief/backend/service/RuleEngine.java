package com.medibrief.backend.service;

import com.medibrief.backend.model.AiResponse;
import com.medibrief.backend.model.Flag;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class RuleEngine {

    private static final Set<String> CHRONIC_DISEASES = Set.of(
            "diabetes", "hypertension", "asthma", "copd", "ckd", 
            "coronary artery disease", "heart failure"
    );

    public List<Flag> generateFlags(AiResponse.Entities entities) {
        List<Flag> flags = new ArrayList<>();

        if (entities == null) return flags;

        // Process Allergies
        if (entities.getAllergies() != null) {
            for (AiResponse.Entity allergy : entities.getAllergies()) {
                flags.add(Flag.builder()
                        .type("ALLERGY")
                        .entity(allergy.getText())
                        .severity("HIGH")
                        .reason("Allergy detected — potential life-threatening risk")
                        .confidence("HIGH")
                        .sourceId(allergy.getId())
                        .build());
            }
        }

        // Process Diseases
        if (entities.getDiseases() != null) {
            for (AiResponse.Entity disease : entities.getDiseases()) {
                String severity = isChronicDisease(disease.getText()) ? "HIGH" : "MEDIUM";
                String reason = "HIGH".equals(severity) ? 
                        "Chronic condition with ongoing management implications" : 
                        "Diagnosed condition requiring clinical context";

                flags.add(Flag.builder()
                        .type("CHRONIC_DISEASE")
                        .entity(disease.getText())
                        .severity(severity)
                        .reason(reason)
                        .confidence("MEDIUM")
                        .sourceId(disease.getId())
                        .build());
            }
        }

        // Process Procedures
        if (entities.getProcedures() != null) {
            for (AiResponse.Entity procedure : entities.getProcedures()) {
                flags.add(Flag.builder()
                        .type("PAST_PROCEDURE")
                        .entity(procedure.getText())
                        .severity("MEDIUM")
                        .reason("Surgical history relevant for clinical decisions")
                        .confidence("HIGH")
                        .sourceId(procedure.getId())
                        .build());
            }
        }

        // Process Medications
        if (entities.getMedications() != null) {
            for (AiResponse.Entity med : entities.getMedications()) {
                flags.add(Flag.builder()
                        .type("MEDICATION_NOTE")
                        .entity(med.getText())
                        .severity("LOW")
                        .reason("Active or discontinued medication noted")
                        .confidence("HIGH")
                        .sourceId(med.getId())
                        .build());
            }
        }

        return flags;
    }

    private boolean isChronicDisease(String name) {
        String lowerName = name.toLowerCase();
        return CHRONIC_DISEASES.stream().anyMatch(lowerName::contains);
    }
}
