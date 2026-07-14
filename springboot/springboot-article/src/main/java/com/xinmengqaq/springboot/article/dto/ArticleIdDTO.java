package com.xinmengqaq.springboot.article.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ArticleIdDTO {

    @NotNull(message = "文章ID不能为空")
    private Long id;

}