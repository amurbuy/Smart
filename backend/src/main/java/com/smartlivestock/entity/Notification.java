package com.smartlivestock.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Message text shown to farmer
    @Column(nullable = false, length = 500)
    private String message;

    // Type: BIRTH, PREGNANCY_REMINDER, SYSTEM
    @Column(nullable = false, length = 30)
    @Builder.Default
    private String type = "SYSTEM";

    // Link to related animal (optional)
    @Column(name = "livestock_id")
    private Long livestockId;

    // Tag number for quick display
    @Column(name = "tag_number", length = 50)
    private String tagNumber;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;
}
