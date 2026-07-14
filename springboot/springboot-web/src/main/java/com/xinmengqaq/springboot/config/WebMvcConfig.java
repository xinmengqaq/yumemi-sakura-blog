package com.xinmengqaq.springboot.config;


import com.xinmengqaq.springboot.interceptor.AuthInterceptor;
import jakarta.annotation.Resource;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Resource
    private AuthInterceptor authInterceptor;

    /**
     * 配置拦截器
     * @param registry 拦截器注册器，用于注册和配置拦截器
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 添加认证拦截器，并配置拦截路径和排除路径
        registry.addInterceptor(authInterceptor)
                 // 拦截所有以 /api/admin/ 开头的路径
                .addPathPatterns("/api/admin/**")
                // 排除以下路径不被拦截
                .excludePathPatterns(
                        "/api/admin/login",
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html",
                        "/webjars/**",
                        "/favicon.ico"
                );
    }
}
