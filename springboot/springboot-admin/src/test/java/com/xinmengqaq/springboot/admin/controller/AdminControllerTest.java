package com.xinmengqaq.springboot.admin.controller;

import com.xinmengqaq.springboot.common.Result;
import com.xinmengqaq.springboot.common.enums.ErrorCode;
import com.xinmengqaq.springboot.common.exception.BusinessException;
import com.xinmengqaq.springboot.admin.dto.AdminLoginDTO;
import com.xinmengqaq.springboot.admin.dto.AdminPasswordChangeDTO;
import com.xinmengqaq.springboot.admin.dto.AdminProfileUpdateDTO;
import com.xinmengqaq.springboot.admin.service.AdminService;
import com.xinmengqaq.springboot.admin.vo.AdminVO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private AdminService adminService;

    @InjectMocks
    private AdminController adminController;

    @Test
    @DisplayName("登录接口返回统一成功响应和管理员 Token")
    void testLoginReturnsSuccessResult() {
        AdminLoginDTO dto = new AdminLoginDTO();
        dto.setUsername("admin");
        dto.setPassword("123456");
        AdminVO adminVO = adminVO("jwt-token");
        when(adminService.login(dto)).thenReturn(adminVO);

        Result result = adminController.login(dto);

        assertThat(result.getCode()).isEqualTo(ErrorCode.SUCCESS.getCode());
        assertThat(result.getData()).isSameAs(adminVO);
    }

    @Test
    @DisplayName("校验 Token 接口在通过拦截器后返回 valid=true")
    void testValidateTokenReturnsValidTrue() {
        Result result = adminController.validateToken();

        assertThat(result.getCode()).isEqualTo(ErrorCode.SUCCESS.getCode());
        assertThat(result.getData()).isEqualTo(Map.of("valid", true));
    }

    @Test
    @DisplayName("刷新 Token 接口使用请求上下文里的管理员ID签发新 Token")
    void testRefreshTokenUsesAdminIdFromRequest() {
        MockHttpServletRequest request = requestWithAdminId(1L);
        when(adminService.refreshToken(1L)).thenReturn("new-token");

        Result result = adminController.refreshToken(request);

        assertThat(result.getCode()).isEqualTo(ErrorCode.SUCCESS.getCode());
        assertThat(result.getData()).isEqualTo(Map.of("token", "new-token"));
    }

    @Test
    @DisplayName("获取当前管理员接口使用请求上下文里的管理员ID")
    void testProfileUsesAdminIdFromRequest() {
        MockHttpServletRequest request = requestWithAdminId(1L);
        AdminVO adminVO = adminVO(null);
        when(adminService.getCurrentAdmin(1L)).thenReturn(adminVO);

        Result result = adminController.profile(request);

        assertThat(result.getCode()).isEqualTo(ErrorCode.SUCCESS.getCode());
        assertThat(result.getData()).isSameAs(adminVO);
    }

    @Test
    @DisplayName("修改资料接口返回更新后的管理员资料")
    void testUpdateProfileReturnsUpdatedProfile() {
        MockHttpServletRequest request = requestWithAdminId(1L);
        AdminProfileUpdateDTO dto = new AdminProfileUpdateDTO();
        dto.setName("新名字");
        dto.setAvatar("/files/new-avatar.png");
        AdminVO adminVO = adminVO(null);
        when(adminService.updateProfile(1L, dto)).thenReturn(adminVO);

        Result result = adminController.updateProfile(dto, request);

        assertThat(result.getCode()).isEqualTo(ErrorCode.SUCCESS.getCode());
        assertThat(result.getData()).isSameAs(adminVO);
    }

    @Test
    @DisplayName("修改密码接口成功后返回密码修改成功消息")
    void testChangePasswordReturnsSuccessMessage() {
        MockHttpServletRequest request = requestWithAdminId(1L);
        AdminPasswordChangeDTO dto = new AdminPasswordChangeDTO();
        dto.setOldPassword("123456");
        dto.setNewPassword("new123456");

        Result result = adminController.changePassword(dto, request);

        verify(adminService).changePassword(1L, dto);
        assertThat(result.getCode()).isEqualTo(ErrorCode.SUCCESS.getCode());
        assertThat(result.getMsg()).isEqualTo("密码修改成功");
        assertThat(result.getData()).isNull();
    }

    @Test
    @DisplayName("需要登录的接口没有请求上下文管理员ID时返回未登录异常")
    void testProtectedControllerRejectsMissingAdminIdAttribute() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        assertThatThrownBy(() -> adminController.profile(request))
                .isInstanceOfSatisfying(BusinessException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.UNAUTHORIZED.getCode());
                    assertThat(exception.getMessage()).isEqualTo("未登录或登录已过期");
                });
    }

    @Test
    @DisplayName("退出登录接口返回退出成功消息")
    void testLogoutReturnsSuccessMessage() {
        Result result = adminController.logout();

        assertThat(result.getCode()).isEqualTo(ErrorCode.SUCCESS.getCode());
        assertThat(result.getMsg()).isEqualTo("退出成功");
        assertThat(result.getData()).isNull();
    }

    private MockHttpServletRequest requestWithAdminId(Long adminId) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("adminId", adminId);
        return request;
    }

    private AdminVO adminVO(String token) {
        return AdminVO.builder()
                .id(1L)
                .username("admin")
                .name("梦梦")
                .role("admin")
                .avatar("/files/avatar.png")
                .token(token)
                .build();
    }
}

