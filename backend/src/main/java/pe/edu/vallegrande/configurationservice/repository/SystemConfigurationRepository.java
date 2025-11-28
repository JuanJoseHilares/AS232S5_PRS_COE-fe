package pe.edu.vallegrande.configurationservice.repository;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import pe.edu.vallegrande.configurationservice.model.SystemConfiguration;


import java.util.UUID;

@Repository
public interface SystemConfigurationRepository extends ReactiveCrudRepository<SystemConfiguration, UUID> {
}
