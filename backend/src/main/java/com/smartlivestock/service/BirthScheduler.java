package com.smartlivestock.service;

import com.smartlivestock.entity.Livestock;
import com.smartlivestock.repository.LivestockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BirthScheduler {

    private final LivestockRepository livestockRepository;
    private final NotificationService notificationService;

    /**
     * Runs every day at 08:00.
     * Also callable manually via triggerNow() from the controller.
     */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void checkBirths() {
        log.info("BirthScheduler: checking expected births...");

        LocalDate today = LocalDate.now();

        List<Livestock> dueMothers = livestockRepository.findAll().stream()
                .filter(a -> a.getExpectedBirthDate() != null)
                .filter(a -> !a.getExpectedBirthDate().isAfter(today))
                .filter(a -> "Female".equalsIgnoreCase(a.getGender()))
                .toList();

        int processed = 0;
        for (Livestock mother : dueMothers) {
            // Deduplicate: skip if we already created a birth notification for this animal
            if (notificationService.birthNotificationExists(mother.getId())) {
                log.info("BirthScheduler: skipping {} — notification already sent", mother.getTagNumber());
                continue;
            }

            // 1. Create draft offspring
            String offspringTag = "DRAFT-" + mother.getTagNumber() + "-"
                    + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

            Livestock offspring = Livestock.builder()
                    .species(mother.getSpecies())
                    .tagNumber(offspringTag)
                    .gender("Female")
                    .birthDate(today)
                    .status("ACTIVE")
                    .isDraft(true)
                    .parentId(mother.getId())
                    .build();

            Livestock savedOffspring = livestockRepository.save(offspring);
            log.info("Created draft offspring {} for mother {}", offspringTag, mother.getTagNumber());

            // 2. Clear mother's pregnancy data
            mother.setPregnancyDate(null);
            mother.setExpectedBirthDate(null);
            livestockRepository.save(mother);

            // 3. Push notification — use MOTHER's id for deduplication key
            String msg = String.format(
                    "🐣 %s (%s) has given birth! Draft offspring [%s] was created. Please confirm the details.",
                    mother.getTagNumber(), mother.getSpecies(), offspringTag);

            notificationService.create(msg, "BIRTH", mother.getId(), offspringTag);
            processed++;
        }

        log.info("BirthScheduler: done. Processed {} new births.", processed);
    }

    /**
     * Manual trigger — called from NotificationController.
     * Allows the farmer to trigger immediately without waiting for cron.
     */
    public void triggerNow() {
        log.info("BirthScheduler: manual trigger requested");
        checkBirths();
    }
}
