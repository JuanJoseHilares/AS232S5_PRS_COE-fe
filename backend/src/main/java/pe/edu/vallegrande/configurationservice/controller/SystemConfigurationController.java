package pe.edu.vallegrande.configurationservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pe.edu.vallegrande.configurationservice.model.SystemConfiguration;
import pe.edu.vallegrande.configurationservice.service.SystemConfigurationService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/system-configurations")
@RequiredArgsConstructor
public class SystemConfigurationController {

    private final SystemConfigurationService service;

    // Listar todas las configuraciones
    @GetMapping
    public Flux<SystemConfiguration> getAll() {
        return service.getAll();
    }

    // Crear una nueva configuración
    @PostMapping("/create")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<SystemConfiguration> create(@RequestBody SystemConfiguration config) {
        return service.create(config);
    }

    // Actualizar una configuración existente
    @PutMapping("/update/{id}")
    public Mono<SystemConfiguration> update(@PathVariable UUID id, @RequestBody SystemConfiguration config) {
        return service.update(id, config);
    }

    // Eliminar lógicamente (soft delete)
    @DeleteMapping("/soft-delete/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> softDelete(@PathVariable UUID id) {
        return service.softDelete(id);
    }

    // Restaurar una configuración eliminada
    @PutMapping("/restore/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> restore(@PathVariable UUID id) {
        return service.restore(id);
    }
}