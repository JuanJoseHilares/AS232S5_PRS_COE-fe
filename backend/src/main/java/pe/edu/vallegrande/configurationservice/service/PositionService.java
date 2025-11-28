package pe.edu.vallegrande.configurationservice.service;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.configurationservice.model.Position;
import pe.edu.vallegrande.configurationservice.repository.PositionRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;


import java.time.LocalDateTime;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class PositionService {


    private final PositionRepository repository;


    // 🔹 Get all active positions
    public Flux<Position> getAllActive() {
        return repository.findAllByActiveTrue();
    }


    // 🔹 Get all inactive positions
    public Flux<Position> getAllInactive() {
        return repository.findAllByActiveFalse();
    }


    // 🔹 Get position by ID
    public Mono<Position> getById(UUID id) {
        return repository.findById(id);
    }


    // 🔹 Create a new position
    public Mono<Position> create(Position position) {
        position.setActive(true); // Always active when created
        position.setCreatedAt(LocalDateTime.now());
        return repository.save(position);
    }


    // 🔹 Update an existing position (without changing the active field)
    public Mono<Position> update(UUID id, Position position) {
        return repository.findById(id)
                .flatMap(existing -> {
                    if (Boolean.FALSE.equals(existing.getActive())) {
                        // If inactive, editing is not allowed
                        return Mono.error(new RuntimeException("Cannot edit an inactive position"));
                    }
                    existing.setPositionCode(position.getPositionCode());
                    existing.setName(position.getName());
                    existing.setDescription(position.getDescription());
                    existing.setHierarchicalLevel(position.getHierarchicalLevel());
                    existing.setBaseSalary(position.getBaseSalary());
                    existing.setMunicipalityId(position.getMunicipalityId());
                    return repository.save(existing);
                });
    }


    // 🔹 Soft delete (logical deletion)
    public Mono<Position> softDelete(UUID id) {
        return repository.findById(id)
                .flatMap(existing -> {
                    existing.setActive(false);
                    return repository.save(existing);
                });
    }


    // 🔹 Restore an inactive position
    public Mono<Position> restore(UUID id) {
        return repository.findById(id)
                .flatMap(existing -> {
                    existing.setActive(true);
                    return repository.save(existing);
                });
    }
}


