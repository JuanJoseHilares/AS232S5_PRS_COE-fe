package pe.edu.vallegrande.configurationservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;
import lombok.Data;

@Data
@Table("test_table")
public class TestEntity {
    @Id
    private Long id;
    private String name;
}