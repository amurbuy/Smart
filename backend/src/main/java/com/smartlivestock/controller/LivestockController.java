package com.smartlivestock.controller;

import com.smartlivestock.dto.LivestockDTO;
import com.smartlivestock.dto.StatsDTO;
import com.smartlivestock.entity.Livestock;
import com.smartlivestock.service.LivestockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/livestock")
@RequiredArgsConstructor
@CrossOrigin(
    origins = {"http://localhost:3000", "http://localhost:3001"},
    methods = {
        RequestMethod.GET, RequestMethod.POST,
        RequestMethod.PUT, RequestMethod.PATCH,
        RequestMethod.DELETE, RequestMethod.OPTIONS
    },
    allowedHeaders = "*",
    allowCredentials = "true"
)
public class LivestockController {

    private final LivestockService service;

    @GetMapping
    public ResponseEntity<List<Livestock>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/stats")
    public ResponseEntity<StatsDTO> getStats() {
        return ResponseEntity.ok(service.getStats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Livestock> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<Livestock> create(@Valid @RequestBody LivestockDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Livestock> update(@PathVariable Long id,
                                            @Valid @RequestBody LivestockDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @PatchMapping("/{id}/confirm")
    public ResponseEntity<Livestock> confirm(@PathVariable Long id,
                                             @RequestBody LivestockDTO dto) {
        return ResponseEntity.ok(service.confirmDraft(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
