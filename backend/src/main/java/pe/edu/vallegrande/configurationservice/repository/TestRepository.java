package pe.edu.vallegrande.configurationservice.repository;

import org.springframework.data.r2dbc.repository.R2dbcRepository;
import pe.edu.vallegrande.configurationservice.model.TestEntity;

public interface TestRepository extends R2dbcRepository<TestEntity, Long> {
}