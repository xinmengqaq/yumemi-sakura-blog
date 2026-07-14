package com.xinmengqaq.springboot.admin.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.xinmengqaq.springboot.admin.entity.Admin;
import lombok.Builder;
import lombok.Data;

/**
 * 管理员登录响应VO
 * 用于封装管理员登录成功后返回的用户信息
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
@Builder
public class AdminVO {

    //管理员id
    private Long id;

    //用户名
    private String username;

    //姓名
    private String name;

    //角色
    private String role;

    //头像URL
    private String avatar;

    //登录令牌
    private String token;


    public static AdminVO from(Admin admin) {
        return AdminVO.builder()
                .id(admin.getId())
                .username(admin.getUsername())
                .name(admin.getName())
                .role(admin.getRole())
                .avatar(admin.getAvatar())
                .build();
    }
}
