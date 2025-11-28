package pe.edu.vallegrande.configurationservice.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 🧩 Configuración de OpenAPI / Swagger para ConfigurationService
 * Proyecto: Valle Grande - Configuración del Sistema
 * Autor: Jheferson Torres Humareda
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                // 🌍 Servidores
                .addServersItem(new Server()
                        .url("http://localhost:5004")
                        .description("Servidor Local"))
                .addServersItem(new Server()
                        .url("https://vallegrande-dev.example.com")
                        .description("Servidor de Desarrollo"))
                // ℹ️ Información del API
                .info(new Info()
                        .title("API - Microservicio de Configuración (Valle Grande)")
                        .version("1.0.0")
                        .description("""
                                API REST del microservicio de configuración del sistema.
                                Permite administrar parámetros, temas y ajustes por tenant.
                                Endpoints principales:
                                - /api/configuracion-tenant
                                - /api/configuracion-tenant/{id}
                                - /api/configuracion-tenant/activos
                                - /api/configuracion-tenant/inactivos
                                """)
                        .contact(new Contact()
                                .name("Jheferson Torres Humareda")
                                .email("jheferson.torres@vallegrande.edu.pe")
                                .url("https://vallegrande.edu.pe"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")));
    }
}
