package com.xinmengqaq.springboot.article.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;


@Data
public class ArticleDTO {

    @NotBlank(message = "文章标题不能为空")
    @Size(max = 120, message = "文章标题不能超过 120 个字符")
    private String title;

    @Size(max = 300, message = "文章摘要不能超过 300 个字符")
    private String summary;

    @NotBlank(message = "文章正文不能为空")
    private String content;

    @Size(max = 500, message = "文章封面地址不能超过 500 个字符")
    private String coverUrl;

    private Long categoryId;

    private List<Long> tagIds = List.of();

    @Pattern(regexp = "draft|published|hidden", message = "文章状态只能是 draft、published、hidden")
    private String status = "draft";

    private Boolean isTop = false;

    private Boolean isRecommend = false;

}
