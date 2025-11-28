package pe.edu.vallegrande.configurationservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pe.edu.vallegrande.configurationservice.model.CategoryAsset;
import pe.edu.vallegrande.configurationservice.service.CategoryAssetService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/categories-assets")
@RequiredArgsConstructor
public class CategoryAssetController {

    private final CategoryAssetService service;

    // Listar todas las categorias
    @GetMapping
    public Flux<CategoryAsset> getAll() {
        return service.getAll();
    }

    // Listar categorias activas
    @GetMapping("/active")
    public Flux<CategoryAsset> getAllActive() {
        return service.getAllActive();
    }

    // Listar categorias inactivas
    @GetMapping("/inactive")
    public Flux<CategoryAsset> getAllInactive() {
        return service.getAllInactive();
    }

    // Listar crear nueva categoria
    @PostMapping("/create")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<CategoryAsset> create(@RequestBody CategoryAsset category) {
        return service.create(category);
    }

    // Actualizar categoria
    @PutMapping("/update/{id}")
    public Mono<CategoryAsset> update(@PathVariable UUID id, @RequestBody CategoryAsset category) {
        return service.update(id, category);
    }

    // Inactivar categoria
    @DeleteMapping("/inactive/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> softDelete(@PathVariable UUID id) {
        return service.softDelete(id).then();
    }

    // Restaurar categoria
    @PatchMapping("/restore/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> restore(@PathVariable UUID id) {
        return service.restore(id).then();
    }
}