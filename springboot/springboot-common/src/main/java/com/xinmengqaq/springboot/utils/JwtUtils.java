package com.xinmengqaq.springboot.utils;

import com.xinmengqaq.springboot.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtils {

    @Resource
    private JwtProperties jwtProperties;

    /**
     * 创建 JWT 令牌。
     * @param adminId 管理员ID，作为令牌的主题
     * @param username 用户名，作为令牌的一个声明
     * @param passwordVersion 密码版本号，用于验证用户密码是否已更新
     * @return JWT 令牌字符串，可用于后续的身份验证
     */
    public String createToken(Long adminId, String username, Integer passwordVersion) {

        // 获取当前时间点，作为 Token 的签发时间基准。
        Instant now = Instant.now();

        // 创建 JWT 构建器，并按顺序设置 Token 的唯一编号、主体、声明、时间和签名。
        return Jwts.builder()
                // 设置 Token 唯一编号，保证每次生成的 Token 都有不同的 jti。
                .id(UUID.randomUUID().toString())
                // 设置 Token 主体，这里使用管理员ID。
                .subject(String.valueOf(adminId))
                // 写入用户名声明，后续可从 Token 中直接读取用户名。
                .claim("username", username)
                // 写入密码版本号声明，用于修改密码后让旧 Token 失效。
                .claim("passwordVersion", passwordVersion)
                // 设置 Token 签发时间。
                .issuedAt(Date.from(now))
                // 设置 Token 过期时间，当前时间加上配置的过期秒数。
                .expiration(Date.from(now.plusSeconds(jwtProperties.getExpireSeconds())))
                // 使用配置密钥和 HS256 算法对 Token 签名。
                .signWith(getSecretKey(), Jwts.SIG.HS256)
                // 生成最终的 JWT 字符串。
                .compact();
    }

    /**
     * 解析 JWT 令牌。
     *
     * @param token JWT 令牌字符串
     * @return Token 中的声明信息
     */
    public Claims parseToken(String token) {
        // 创建 JWT 解析器，并配置签名密钥、时钟偏移量后解析 Token。
        return Jwts.parser()
                // 设置验签密钥，用于验证 Token 是否被篡改。
                .verifyWith(getSecretKey())
                // 设置允许的时钟偏移秒数，减少服务器时间轻微不一致导致的误判。
                .clockSkewSeconds(jwtProperties.getClockSkewSeconds())
                // 构建 JWT 解析器。
                .build()
                // 解析带签名的 Token。
                .parseSignedClaims(token)
                // 获取 Token 载荷中的声明数据。
                .getPayload();
    }

    /**
     * 从 Token 中获取管理员ID。
     *
     * @param token JWT 令牌字符串
     * @return 管理员ID
     */
    public Long getAdminId(String token) {
        // 解析 Token 的 subject 字段，并转换成管理员ID。
        return Long.valueOf(parseToken(token).getSubject());
    }

    /**
     * 从 Token 中获取密码版本号。
     *
     * @param token JWT 令牌字符串
     * @return 密码版本号
     */
    public Integer getPasswordVersion(String token) {
        // 解析 Token 中的 passwordVersion 声明，并按 Integer 类型返回。
        return parseToken(token).get("passwordVersion", Integer.class);
    }

    /**
     * 从 Token 中获取用户名。
     *
     * @param token JWT 令牌字符串
     * @return 用户名
     */
    public String getUsername(String token) {
        // 解析 Token 中的 username 声明，并按 String 类型返回。
        return parseToken(token).get("username", String.class);
    }

    /**
     * 生成 JWT 签名密钥。
     * @return HMAC SHA 密钥
     */
    private SecretKey getSecretKey() {
        // 将 Base64 编码的密钥字符串解码为字节数组。
        byte[] keyBytes = Decoders.BASE64.decode(jwtProperties.getSecret());
        // 使用解码后的字节数组生成 HMAC SHA 签名密钥。
        return Keys.hmacShaKeyFor(keyBytes);
    }
}

