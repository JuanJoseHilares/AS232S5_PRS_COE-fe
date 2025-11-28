package pe.edu.vallegrande.configurationservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.configurationservice.model.Supplier;
import pe.edu.vallegrande.configurationservice.repository.SupplierRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository repository;

    public Flux<Supplier> getAllActive() {
        return repository.findAllByActiveTrueOrderByLegalNameAsc();
    }

    public Flux<Supplier> getAllInactive() {
        return repository.findAllByActiveFalseOrderByLegalNameAsc();
    }

    public Mono<Supplier> getById(UUID id) {
        return repository.findById(id);
    }

    public Mono<Supplier> create(Supplier supplier) {
        supplier.setActive(true);
        supplier.setCreatedAt(OffsetDateTime.now());
        supplier.setUpdatedAt(OffsetDateTime.now());
        
        // municipalityId puede ser null hasta que el otro microservicio esté listo
        // Se mantendrá como null hasta que se integre con el microservicio de municipios
        
        return repository.save(supplier);
    }

    public Mono<Supplier> update(UUID id, Supplier supplierData) {
        return repository.findById(id)
                .flatMap(existing -> {
                    existing.setDocumentTypesId(supplierData.getDocumentTypesId());
                    existing.setNumeroDocumento(supplierData.getNumeroDocumento());
                    existing.setLegalName(supplierData.getLegalName());
                    existing.setTradeName(supplierData.getTradeName());
                    existing.setAddress(supplierData.getAddress());
                    existing.setPhone(supplierData.getPhone());
                    existing.setEmail(supplierData.getEmail());
                    existing.setWebsite(supplierData.getWebsite());
                    existing.setMainContact(supplierData.getMainContact());
                    existing.setTaxCondition(supplierData.getTaxCondition());
                    existing.setIsStateProvider(supplierData.getIsStateProvider());
                    existing.setQualification(supplierData.getQualification());
                    
                    // Solo actualizar municipalityId si se proporciona un valor
                    if (supplierData.getMunicipalityId() != null) {
                        existing.setMunicipalityId(supplierData.getMunicipalityId());
                    }
                    
                    existing.setUpdatedAt(OffsetDateTime.now());
                    return repository.save(existing);
                });
    }

    public Mono<Void> softDelete(UUID id) {
        return repository.findById(id)
                .flatMap(supplier -> {
                    supplier.setActive(false);
                    supplier.setUpdatedAt(OffsetDateTime.now());
                    return repository.save(supplier);
                })
                .then();
    }

    public Mono<Void> restore(UUID id) {
        return repository.findById(id)
                .flatMap(supplier -> {
                    supplier.setActive(true);
                    supplier.setUpdatedAt(OffsetDateTime.now());
                    return repository.save(supplier);
                })
                .then();
    }
}
