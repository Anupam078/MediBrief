package com.medibrief.backend.service;

import com.medibrief.backend.cache.ProcessingCache;
import com.medibrief.backend.client.AiServiceClient;
import com.medibrief.backend.model.AiResponse;
import com.medibrief.backend.model.Flag;
import com.medibrief.backend.model.PatientResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatientService {

    private final AiServiceClient aiServiceClient;
    private final RuleEngine ruleEngine;
    private final ProcessingCache processingCache;

    public PatientResponse processRecord(String rawText) {
        log.info("Processing request | textLength={}", rawText.length());

        // Check Cache
        Optional<PatientResponse> cachedResult = processingCache.get(rawText);
        if (cachedResult.isPresent()) {
            log.info("Cache hit for input text");
            return cachedResult.get();
        }

        log.warn("Cache miss | calling AI service");
        
        // Call Python AI Service
        AiResponse aiResponse = aiServiceClient.process(rawText);

        // Execute deterministic rule engine
        List<Flag> flags = ruleEngine.generateFlags(aiResponse.getEntities());

        // Assemble Final Response
        PatientResponse response = PatientResponse.builder()
                .summary(aiResponse.getSummary())
                .timeline(aiResponse.getTimeline())
                .flags(flags)
                .sources(aiResponse.getSources())
                .partial(aiResponse.isPartial())
                .build();

        // Store in cache
        processingCache.put(rawText, response);

        return response;
    }
}
