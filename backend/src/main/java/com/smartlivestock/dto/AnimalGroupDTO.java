package com.smartlivestock.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class AnimalGroupDTO {

    @NotBlank(message = "Group name is required")
    private String name;

    private String description;

    private List<Long> animalIds;
}
