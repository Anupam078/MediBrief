package com.medibrief.backend.controller;

import com.medibrief.backend.model.PatientRequest;
import com.medibrief.backend.model.PatientResponse;
import com.medibrief.backend.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/patient")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @PostMapping("/process")
    public ResponseEntity<PatientResponse> process(@RequestBody @Valid PatientRequest request) {
        PatientResponse response = patientService.processRecord(request.getText());
        return ResponseEntity.ok(response);
    }
}
