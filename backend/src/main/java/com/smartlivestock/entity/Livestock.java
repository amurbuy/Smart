package com.smartlivestock.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.time.Period;

@Entity
@Table(name = "livestock")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Livestock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Species is required")
    @Column(nullable = false, length = 50)
    private String species;

    @NotBlank(message = "Tag number is required")
    @Column(name = "tag_number", nullable = false, unique = true, length = 50)
    private String tagNumber;

    @NotBlank(message = "Gender is required")
    @Column(nullable = false, length = 10)
    private String gender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    // Only for Female animals
    @Column(name = "pregnancy_date")
    private LocalDate pregnancyDate;

    @Column(name = "expected_birth_date")
    private LocalDate expectedBirthDate;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "is_draft", nullable = false)
    @Builder.Default
    private Boolean isDraft = false;

    // If this animal was born from a known parent, store parent id
    @Column(name = "parent_id")
    private Long parentId;

    // Transient: computed age string, not stored in DB
    @Transient
    public String getAge() {
        if (birthDate == null) return null;
        Period p = Period.between(birthDate, LocalDate.now());
        if (p.getYears() > 0)  return p.getYears()  + "y " + p.getMonths() + "m";
        if (p.getMonths() > 0) return p.getMonths() + " months";
        return p.getDays() + " days";
    }
}
