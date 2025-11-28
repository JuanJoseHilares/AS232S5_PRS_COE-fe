package pe.edu.vallegrande.configurationservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

/**
 * 🌐 Configuración CORS para ConfigurationService
 * Permite solicitudes desde cualquier puerto del frontend
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();
        
        // importante: desactivamos credenciales
        config.setAllowCredentials(false);
        
        // permite todos los orígenes
        config.addAllowedOriginPattern("*");
        
        // permite todos los headers
        config.addAllowedHeader("*");
        
        // permite todos los métodos
        config.addAllowedMethod("*");
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        
        return new CorsWebFilter(source);
    }
}
