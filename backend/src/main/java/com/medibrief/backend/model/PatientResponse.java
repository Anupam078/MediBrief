package com.medibrief.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientResponse {
    private String summary;
    private List<TimelineEvent> timeline;
    private List<Flag> flags;
    private Map<String, String> sources;
    private boolean partial;
    private String error;
}
