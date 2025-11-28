package pe.edu.vallegrande.configurationservice.controller;

import pe.edu.vallegrande.configurationservice.model.DocumentType;
import pe.edu.vallegrande.configurationservice.service.DocumentTypeService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/document-types")
public class DocumentTypeController {

    private final DocumentTypeService service;

    public DocumentTypeController(DocumentTypeService service) {
        this.service = service;
    }

    @GetMapping
    public Flux<DocumentType> listAllActive() {
        return service.getAllActive();
    }

    @GetMapping("/inactive")
    public Flux<DocumentType> listAllInactive() {
        return service.getAllInactive();
    }

    @GetMapping("/{id}")
    public Mono<DocumentType> getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<DocumentType> create(@RequestBody DocumentType documentType) {
        return service.create(documentType);
    }

    @PutMapping("/{id}")
    public Mono<DocumentType> update(@PathVariable Integer id, @RequestBody DocumentType documentType) {
        return service.update(id, documentType);
    }

    @DeleteMapping("/{id}")
    public Mono<Void> delete(@PathVariable Integer id) {
        return service.delete(id);
    }

    @PatchMapping("/{id}")
    public Mono<DocumentType> partialUpdate(@PathVariable Integer id, @RequestBody DocumentType documentType) {
        return service.partialUpdate(id, documentType);
    }

    @PatchMapping("/{id}/restore")
    public Mono<Void> restore(@PathVariable Integer id) {
        return service.restore(id);
    }
}

