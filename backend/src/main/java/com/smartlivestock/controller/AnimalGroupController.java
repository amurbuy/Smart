package com.smartlivestock.controller;

import com.smartlivestock.dto.AnimalGroupDTO;
import com.smartlivestock.entity.AnimalGroup;
import com.smartlivestock.service.AnimalGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class AnimalGroupController {

    private final AnimalGroupService service;

    @GetMapping
    public ResponseEntity<List<AnimalGroup>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnimalGroup> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<AnimalGroup> create(@Valid @RequestBody AnimalGroupDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AnimalGroup> update(@PathVariable Long id,
                                              @Valid @RequestBody AnimalGroupDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
