package com.smartlivestock.service;

import com.smartlivestock.dto.AnimalGroupDTO;
import com.smartlivestock.entity.AnimalGroup;
import com.smartlivestock.entity.Livestock;
import com.smartlivestock.exception.ResourceNotFoundException;
import com.smartlivestock.repository.AnimalGroupRepository;
import com.smartlivestock.repository.LivestockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AnimalGroupService {

    private final AnimalGroupRepository groupRepository;
    private final LivestockRepository livestockRepository;

    @Transactional(readOnly = true)
    public List<AnimalGroup> findAll() {
        return groupRepository.findAll();
    }

    @Transactional(readOnly = true)
    public AnimalGroup findById(Long id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + id));
    }

    public AnimalGroup create(AnimalGroupDTO dto) {
        List<Livestock> animals = resolveAnimals(dto.getAnimalIds());
        AnimalGroup group = AnimalGroup.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .animals(animals)
                .build();
        AnimalGroup saved = groupRepository.save(group);
        log.info("Created group '{}' with {} animals", saved.getName(), animals.size());
        return saved;
    }

    public AnimalGroup update(Long id, AnimalGroupDTO dto) {
        AnimalGroup group = findById(id);
        group.setName(dto.getName());
        group.setDescription(dto.getDescription());
        group.setAnimals(resolveAnimals(dto.getAnimalIds()));
        return groupRepository.save(group);
    }

    public void delete(Long id) {
        AnimalGroup group = findById(id);
        group.getAnimals().clear();
        groupRepository.delete(group);
        log.info("Deleted group id={}", id);
    }

    private List<Livestock> resolveAnimals(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return new ArrayList<>();
        return livestockRepository.findAllById(ids);
    }
}
