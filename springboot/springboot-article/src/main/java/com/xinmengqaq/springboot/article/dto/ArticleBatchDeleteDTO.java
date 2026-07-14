package com.xinmengqaq.springboot.article.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;

@Data
public class ArticleBatchDeleteDTO {

    @NotEmpty(message = "文章ID列表不能为空")
    private List<@NotNull(message = "文章ID不能为空") @Positive(message = "文章ID必须大于0") Long> ids;

}
