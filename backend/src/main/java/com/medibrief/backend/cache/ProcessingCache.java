package com.medibrief.backend.cache;

import com.medibrief.backend.model.PatientResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ProcessingCache {
    private final Map<String, CachedResult> cache = new ConcurrentHashMap<>();

    @Value("${cache.ttl.seconds:3600}")
    private long cacheTtlSeconds;

    public Optional<PatientResponse> get(String text) {
        String hash = generateHash(text);
        CachedResult result = cache.get(hash);
        
        if (result != null && !isExpired(result)) {
            return Optional.of(result.getResponse());
        }
        
        if (result != null) {
            cache.remove(hash); // clear expired
        }
        
        return Optional.empty();
    }

    public void put(String text, PatientResponse response) {
        cache.put(generateHash(text), new CachedResult(response, System.currentTimeMillis()));
    }

    private boolean isExpired(CachedResult result) {
        return (System.currentTimeMillis() - result.getCreatedAt()) > (cacheTtlSeconds * 1000);
    }

    private String generateHash(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * hash.length);
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    @Getter
    @AllArgsConstructor
    private static class CachedResult {
        private final PatientResponse response;
        private final long createdAt;
    }
}
