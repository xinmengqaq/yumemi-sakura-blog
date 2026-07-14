package com.xinmengqaq.springboot.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordConfig {

/**
 * 配置密码加密器Bean
 * 使用BCrypt加密算法对密码进行加密处理
 * BCrypt是一种安全的密码哈希算法，能够自动加盐并防止彩虹表攻击
 *
 * @return PasswordEncoder 密码加密器实例，用于用户密码的加密验证
 */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

}

