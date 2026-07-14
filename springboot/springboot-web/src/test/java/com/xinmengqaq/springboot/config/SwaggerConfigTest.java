package com.xinmengqaq.springboot.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.media.ObjectSchema;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.media.StringSchema;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SwaggerConfigTest {

    private final SwaggerConfig swaggerConfig = new SwaggerConfig();

    @Test
    @DisplayName("Swagger Schema 字段按 Java 字段声明顺序展示")
    void testSchemaPropertyOrderCustomizerKeepsJavaFieldOrder() {
        Schema<?> articleSchema = schemaWithProperties(
                "content", "coverUrl", "createdAt", "id", "isRecommend", "isTop",
                "publishedAt", "status", "summary", "title", "updatedAt"
        );
        Schema<?> resultSchema = schemaWithProperties("code", "data", "msg");
        OpenAPI openApi = new OpenAPI()
                .components(new Components()
                        .addSchemas("ArticleVO", articleSchema)
                        .addSchemas("Result", resultSchema));

        swaggerConfig.schemaPropertyOrderCustomizer().customise(openApi);

        assertThat(propertyNames(articleSchema)).containsSubsequence(
                "id", "title", "summary", "content", "coverUrl", "status",
                "isTop", "isRecommend", "publishedAt", "createdAt", "updatedAt"
        );
        assertThat(propertyNames(resultSchema)).containsExactly("code", "msg", "data");
    }

    private Schema<?> schemaWithProperties(String... propertyNames) {
        Schema<?> schema = new ObjectSchema();
        schema.setProperties(new LinkedHashMap<>());
        for (String propertyName : propertyNames) {
            schema.addProperty(propertyName, new StringSchema());
        }
        return schema;
    }

    private List<String> propertyNames(Schema<?> schema) {
        return new ArrayList<>(schema.getProperties().keySet());
    }
}
