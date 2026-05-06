package com.shopflow.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadRoot = Path.of("src/main/resources/static/uploads").toAbsolutePath().normalize().toUri().toString();

        registry.addResourceHandler("/uploads/**")
                .setCacheControl(CacheControl.maxAge(0, TimeUnit.SECONDS).mustRevalidate())
                .addResourceLocations(uploadRoot, "classpath:/static/uploads/");
    }
}
