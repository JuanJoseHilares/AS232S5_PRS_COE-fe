package pe.edu.vallegrande.configurationservice.repository;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import pe.edu.vallegrande.configurationservice.model.CategoryAsset;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface CategoryAssetRepository extends ReactiveCrudRepository<CategoryAsset, UUID> {
    Flux<CategoryAsset> findAllByActiveTrueOrderByNameAsc();
    Flux<CategoryAsset> findAllByActiveFalseOrderByNameAsc();
}