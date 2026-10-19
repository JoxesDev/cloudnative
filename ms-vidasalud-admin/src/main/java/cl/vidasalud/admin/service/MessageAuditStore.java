package cl.vidasalud.admin.service;

import cl.vidasalud.admin.dto.ProcessedMessageLogDto;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;

@Component
public class MessageAuditStore {

    private static final int MAX_ENTRIES = 100;
    private final ConcurrentLinkedDeque<ProcessedMessageLogDto> logStore = new ConcurrentLinkedDeque<>();

    public void record(ProcessedMessageLogDto logEntry) {
        logStore.addFirst(logEntry);
        while (logStore.size() > MAX_ENTRIES) {
            logStore.removeLast();
        }
    }

    public List<ProcessedMessageLogDto> getRecentLogs() {
        return Collections.unmodifiableList(new ArrayList<>(logStore));
    }

    public void clear() {
        logStore.clear();
    }
}
