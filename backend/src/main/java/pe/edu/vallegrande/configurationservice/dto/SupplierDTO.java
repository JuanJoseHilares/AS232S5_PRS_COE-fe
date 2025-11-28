package pe.edu.vallegrande.configurationservice.dto;

import lombok.Data;

@Data
public class SupplierDTO {
    private Integer documentTypesId;
    private String numeroDocumento;
    private String legalName;
    private String tradeName;
    private String address;
    private String phone;
    private String email;
    private String website;
    private String mainContact;
    private String taxCondition;
    private Boolean isStateProvider;
    private Short qualification;
}
