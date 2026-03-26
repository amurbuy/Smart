package com.smartlivestock.controller;

import com.smartlivestock.entity.Notification;
import com.smartlivestock.service.BirthScheduler;
import com.smartlivestock.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(
    origins = {"http://localhost:3000", "http://localhost:3001"},
    methods = {
        RequestMethod.GET, RequestMethod.POST,
        RequestMethod.PATCH, RequestMethod.OPTIONS
    },
    allowedHeaders = "*",
    allowCredentials = "true"
)
public class NotificationController {

    private final NotificationService service;
    private final BirthScheduler birthScheduler;

    @GetMapping
    public ResponseEntity<List<Notification>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount() {
        return ResponseEntity.ok(Map.of("count", service.countUnread()));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        service.markRead(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead() {
        service.markAllRead();
        return ResponseEntity.noContent().build();
    }

    // Manual trigger — no need to wait for 08:00 cron
    @PostMapping("/trigger-births")
    public ResponseEntity<String> triggerBirths() {
        birthScheduler.triggerNow();
        return ResponseEntity.ok("Birth check triggered");
    }
}
