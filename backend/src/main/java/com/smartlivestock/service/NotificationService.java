package com.smartlivestock.service;

import com.smartlivestock.entity.Notification;
import com.smartlivestock.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationService {

    private final NotificationRepository repository;

    @Transactional(readOnly = true)
    public List<Notification> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public long countUnread() {
        return repository.countByIsReadFalse();
    }

    public void markAllRead() {
        repository.markAllRead();
    }

    public void markRead(Long id) {
        repository.findById(id).ifPresent(n -> {
            n.setIsRead(true);
            repository.save(n);
        });
    }

    public Notification create(String message, String type, Long livestockId, String tagNumber) {
        Notification n = Notification.builder()
                .message(message)
                .type(type)
                .livestockId(livestockId)
                .tagNumber(tagNumber)
                .build();
        return repository.save(n);
    }

    public boolean birthNotificationExists(Long livestockId) {
        return repository.existsByLivestockIdAndType(livestockId, "BIRTH");
    }
}
