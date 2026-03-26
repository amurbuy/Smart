package com.smartlivestock.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LivestockDTO {

    @NotBlank(message = "Species is required")
    private String species;

    @NotBlank(message = "Tag number is required")
    private String tagNumber;

    @NotBlank(message = "Gender is required")
    private String gender;

    private LocalDate birthDate;
    private LocalDate pregnancyDate;
    private String status;
    private Boolean isDraft;
}
