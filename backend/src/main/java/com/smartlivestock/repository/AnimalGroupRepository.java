package com.smartlivestock.repository;

import com.smartlivestock.entity.AnimalGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnimalGroupRepository extends JpaRepository<AnimalGroup, Long> {
    boolean existsByName(String name);
}
