package pe.edu.vallegrande.configurationservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pe.edu.vallegrande.configurationservice.model.Area;
import pe.edu.vallegrande.configurationservice.service.AreaService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/areas")
@RequiredArgsConstructor
public class AreasController {

    private final AreaService service;

    @GetMapping
    public Flux<Area> getAllRoot() {
        return service.getAll();
    }

    @GetMapping("/GetAll")
    public Flux<Area> getAll() {
        return service.getAll();
    }

    @GetMapping("/active")
    public Flux<Area> getAllActive() {
        return service.getAllActive();
    }

    @GetMapping("/inactive")
    public Flux<Area> getAllInactive() {
        return service.getAllInactive();
    }

    @PostMapping("/create")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Area> create(@RequestBody Area entity) {
        return service.create(entity);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Area> createAtRoot(@RequestBody Area entity) {
        return service.create(entity);
    }

    @PutMapping("/update/{id}")
    public Mono<Area> update(@PathVariable UUID id, @RequestBody Area entity) {
        return service.update(id, entity);
    }

    @DeleteMapping("/inactive/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> softDelete(@PathVariable UUID id) {
        return service.softDelete(id);
    }

    @PatchMapping("/restore/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> restore(@PathVariable UUID id) {
        return service.restore(id);
    }

    // Hard delete (permanent)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> hardDeleteById(@PathVariable UUID id) {
        return service.hardDeleteById(id);
    }

    @DeleteMapping("/by-code/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> hardDeleteByCode(@PathVariable String code) {
        return service.hardDeleteByCode(code);
    }
}
