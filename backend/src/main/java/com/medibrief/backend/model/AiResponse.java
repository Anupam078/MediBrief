package com.medibrief.backend.model;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class AiResponse {
    private String summary;
    private List<TimelineEvent> timeline;
    private Entities entities;
    private Map<String, String> sources;
    private boolean partial;

    @Data
    public static class Entities {
        private List<Entity> diseases;
        private List<Entity> allergies;
        private List<Entity> medications;
        private List<Entity> procedures;
        private List<Entity> symptoms;
    }

    @Data
    public static class Entity {
        private String id;
        private String text;
        private String label;
    }
}
