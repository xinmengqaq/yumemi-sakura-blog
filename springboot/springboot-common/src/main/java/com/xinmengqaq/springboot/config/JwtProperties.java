package com.xinmengqaq.springboot.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@Data
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    /**
     * JWT 密钥，配置文件中存 Base64 字符串
     */
    private String secret;

    /**
     * Token 过期时间，单位秒
     */
    private Long expireSeconds;

    /**
     * 时钟偏移量，单位秒
     */
    private Long clockSkewSeconds;


}
