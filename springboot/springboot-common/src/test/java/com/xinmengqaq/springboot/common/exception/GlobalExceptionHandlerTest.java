package com.xinmengqaq.springboot.common.exception;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import com.xinmengqaq.springboot.common.Result;
import com.xinmengqaq.springboot.common.enums.ErrorCode;
import io.jsonwebtoken.MalformedJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @BeforeEach
    void closeExceptionLog() {
        Logger logger = (Logger) LoggerFactory.getLogger(GlobalExceptionHandler.class);
        logger.setLevel(Level.OFF);
    }

    @Test
    @DisplayName("业务异常会按业务错误码返回")
    void testHandleBusinessExceptionReturnsBusinessCode() {
        BusinessException exception = new BusinessException(ErrorCode.NOT_FOUND, "管理员不存在");

        Result result = handler.handleBusinessException(exception);

        assertThat(result.getCode()).isEqualTo(ErrorCode.NOT_FOUND.getCode());
        assertThat(result.getMsg()).isEqualTo("管理员不存在");
        assertThat(result.getData()).isNull();
    }

    @Test
    @DisplayName("JWT 异常会返回未登录错误")
    void testHandleJwtExceptionReturnsUnauthorized() {
        Result result = handler.handleJwtException(new MalformedJwtException("token 格式错误"));

        assertThat(result.getCode()).isEqualTo(ErrorCode.UNAUTHORIZED.getCode());
        assertThat(result.getMsg()).isEqualTo("登录已过期，请重新登录");
        assertThat(result.getData()).isNull();
    }

    @Test
    @DisplayName("系统异常会返回统一系统错误")
    void testHandleExceptionReturnsSystemError() {
        Result result = handler.handleException(new RuntimeException("数据库连接失败"));

        assertThat(result.getCode()).isEqualTo(ErrorCode.SYSTEM_ERROR.getCode());
        assertThat(result.getMsg()).isEqualTo(ErrorCode.SYSTEM_ERROR.getMessage());
        assertThat(result.getData()).isNull();
    }
}
