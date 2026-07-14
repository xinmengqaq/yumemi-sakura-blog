package com.xinmengqaq.springboot.article.dto;

import com.xinmengqaq.springboot.common.page.PageQueryDTO;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;


@Data
@EqualsAndHashCode(callSuper = true)
public class ArticlePageQueryDTO extends PageQueryDTO {

    @Size(max = 50, message = "关键词不能超过 50 个字符")
    private String keyword;

    @Pattern(regexp = "draft|published|hidden", message = "文章状态只能是 draft、published、hidden")
    private String status;

    private Long categoryId;

    private Long tagId;


}
