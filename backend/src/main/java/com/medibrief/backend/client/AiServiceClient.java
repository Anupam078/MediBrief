package com.medibrief.backend.client;

import com.medibrief.backend.model.AiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

@Component
public class AiServiceClient {

    private final String aiServiceUrl;
    private final RestTemplate restTemplate;

    public AiServiceClient(
            @Value("${ai.service.url}") String aiServiceUrl,
            @Value("${ai.service.timeout.connect:5000}") int connectTimeout,
            @Value("${ai.service.timeout.read:30000}") int readTimeout) {
        
        this.aiServiceUrl = aiServiceUrl;
        
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);
        this.restTemplate = new RestTemplate(factory);
    }

    public AiResponse process(String text) {
        Map<String, String> body = Map.of("text", text);
        ResponseEntity<AiResponse> response = restTemplate.postForEntity(
                aiServiceUrl + "/process",
                body,
                AiResponse.class
        );
        return response.getBody();
    }
}
