package com.xinmengqaq.springboot.config;

import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.MapperFeature;

/**
 * Jackson JSON 序列化配置
 */
@Configuration
public class JacksonConfig {

    @Bean
    public JsonMapperBuilderCustomizer jsonFieldOrderCustomizer() {
        return builder -> builder.disable(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY);
    }
}
