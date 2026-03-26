package com.smartlivestock.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatsDTO {
    private long totalAnimals;
    private long pregnant;
    private long drafts;
    private long males;
    private long females;
    private long activeAnimals;
    private long avgAgeMonths;
}
