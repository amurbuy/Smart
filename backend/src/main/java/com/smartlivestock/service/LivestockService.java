package com.smartlivestock.service;

import com.smartlivestock.dto.LivestockDTO;
import com.smartlivestock.dto.StatsDTO;
import com.smartlivestock.entity.Livestock;
import com.smartlivestock.exception.DuplicateTagException;
import com.smartlivestock.exception.ResourceNotFoundException;
import com.smartlivestock.repository.LivestockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LivestockService {

    private static final int SHEEP_GESTATION_DAYS = 150;
    private static final int COW_GESTATION_DAYS   = 283;

    private final LivestockRepository repository;

    // ── READ ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Livestock> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Livestock findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Livestock not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public StatsDTO getStats() {
        List<Livestock> all = repository.findAll();
        long total    = all.size();
        long pregnant = all.stream()
                .filter(a -> a.getPregnancyDate() != null && a.getExpectedBirthDate() != null)
                .count();
        long drafts   = all.stream().filter(a -> Boolean.TRUE.equals(a.getIsDraft())).count();
        long males    = all.stream().filter(a -> "Male".equalsIgnoreCase(a.getGender())).count();
        long females  = all.stream().filter(a -> "Female".equalsIgnoreCase(a.getGender())).count();
        long active   = all.stream().filter(a -> "ACTIVE".equals(a.getStatus())).count();
        long avgAge   = (long) all.stream()
                .filter(a -> a.getBirthDate() != null)
                .mapToLong(a -> ChronoUnit.MONTHS.between(a.getBirthDate(), LocalDate.now()))
                .average()
                .orElse(0);
        return new StatsDTO(total, pregnant, drafts, males, females, active, avgAge);
    }

    // ── CREATE ────────────────────────────────────────────────────────────────

    public Livestock create(LivestockDTO dto) {
        if (repository.existsByTagNumber(dto.getTagNumber())) {
            throw new DuplicateTagException("Tag number already exists: " + dto.getTagNumber());
        }

        LocalDate pregnancyDate = isMale(dto.getGender()) ? null : dto.getPregnancyDate();

        Livestock animal = Livestock.builder()
                .species(dto.getSpecies())
                .tagNumber(dto.getTagNumber())
                .gender(dto.getGender())
                .birthDate(dto.getBirthDate())
                .pregnancyDate(pregnancyDate)
                .expectedBirthDate(calculateExpectedBirthDate(dto.getSpecies(), pregnancyDate))
                .status(dto.getStatus() != null ? dto.getStatus() : "ACTIVE")
                .isDraft(dto.getIsDraft() != null ? dto.getIsDraft() : false)
                .build();

        Livestock saved = repository.save(animal);
        log.info("Created livestock: {} ({})", saved.getTagNumber(), saved.getSpecies());
        return saved;
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    public Livestock update(Long id, LivestockDTO dto) {
        Livestock existing = findById(id);

        if (repository.existsByTagNumberAndIdNot(dto.getTagNumber(), id)) {
            throw new DuplicateTagException("Tag number already exists: " + dto.getTagNumber());
        }

        LocalDate pregnancyDate = isMale(dto.getGender()) ? null : dto.getPregnancyDate();

        existing.setSpecies(dto.getSpecies());
        existing.setTagNumber(dto.getTagNumber());
        existing.setGender(dto.getGender());
        existing.setBirthDate(dto.getBirthDate());
        existing.setPregnancyDate(pregnancyDate);
        existing.setExpectedBirthDate(calculateExpectedBirthDate(dto.getSpecies(), pregnancyDate));
        existing.setStatus(dto.getStatus() != null ? dto.getStatus() : existing.getStatus());
        existing.setIsDraft(dto.getIsDraft() != null ? dto.getIsDraft() : existing.getIsDraft());

        Livestock updated = repository.save(existing);
        log.info("Updated livestock id={}", id);
        return updated;
    }

    // ── CONFIRM DRAFT ─────────────────────────────────────────────────────────

    public Livestock confirmDraft(Long id, LivestockDTO dto) {
        Livestock animal = findById(id);

        if (!Boolean.TRUE.equals(animal.getIsDraft())) {
            throw new IllegalStateException("Animal id=" + id + " is not a draft.");
        }

        // Update tag if provided and changed
        if (dto.getTagNumber() != null && !dto.getTagNumber().isBlank()) {
            if (!dto.getTagNumber().equals(animal.getTagNumber())) {
                if (repository.existsByTagNumberAndIdNot(dto.getTagNumber(), id)) {
                    throw new DuplicateTagException("Tag number already exists: " + dto.getTagNumber());
                }
            }
            animal.setTagNumber(dto.getTagNumber());
        }

        if (dto.getGender() != null && !dto.getGender().isBlank()) {
            animal.setGender(dto.getGender());
        }
        if (dto.getBirthDate() != null) {
            animal.setBirthDate(dto.getBirthDate());
        }
        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            animal.setStatus(dto.getStatus());
        }

        animal.setIsDraft(false);

        Livestock confirmed = repository.save(animal);
        log.info("Draft confirmed: id={} tag={}", confirmed.getId(), confirmed.getTagNumber());
        return confirmed;
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    public void delete(Long id) {
        Livestock animal = findById(id);
        repository.delete(animal);
        log.info("Deleted livestock id={}", id);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    private boolean isMale(String gender) {
        return gender != null && gender.equalsIgnoreCase("Male");
    }

    private LocalDate calculateExpectedBirthDate(String species, LocalDate pregnancyDate) {
        if (pregnancyDate == null || species == null) return null;
        return switch (species.trim().toUpperCase()) {
            case "SHEEP" -> pregnancyDate.plusDays(SHEEP_GESTATION_DAYS);
            case "COW"   -> pregnancyDate.plusDays(COW_GESTATION_DAYS);
            default      -> null;
        };
    }
}
