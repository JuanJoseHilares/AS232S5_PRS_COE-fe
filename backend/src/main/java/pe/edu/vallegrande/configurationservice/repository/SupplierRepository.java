package pe.edu.vallegrande.configurationservice.repository;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import pe.edu.vallegrande.configurationservice.model.Supplier;
import reactor.core.publisher.Flux;
import java.util.UUID;

@Repository
public interface SupplierRepository extends ReactiveCrudRepository<Supplier, UUID> {
    Flux<Supplier> findAllByActiveTrueOrderByLegalNameAsc();
    Flux<Supplier> findAllByActiveFalseOrderByLegalNameAsc();
}
