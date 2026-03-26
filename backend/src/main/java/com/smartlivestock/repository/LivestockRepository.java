package com.smartlivestock.repository;

import com.smartlivestock.entity.Livestock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LivestockRepository extends JpaRepository<Livestock, Long> {

    Optional<Livestock> findByTagNumber(String tagNumber);

    boolean existsByTagNumber(String tagNumber);

    boolean existsByTagNumberAndIdNot(String tagNumber, Long id);

    List<Livestock> findByIsDraft(Boolean isDraft);

    List<Livestock> findBySpecies(String species);

    @Query("SELECT l FROM Livestock l WHERE l.pregnancyDate IS NOT NULL AND l.expectedBirthDate IS NOT NULL")
    List<Livestock> findAllPregnant();

    @Query("SELECT COUNT(l) FROM Livestock l WHERE l.pregnancyDate IS NOT NULL AND l.expectedBirthDate IS NOT NULL")
    long countPregnant();

    @Query("SELECT COUNT(l) FROM Livestock l WHERE l.isDraft = true")
    long countDrafts();
}
