package com.xinmengqaq.springboot.admin.service.impl;

import com.xinmengqaq.springboot.admin.dto.AdminPasswordChangeDTO;
import com.xinmengqaq.springboot.admin.dto.AdminProfileUpdateDTO;
import com.xinmengqaq.springboot.admin.entity.Admin;
import com.xinmengqaq.springboot.admin.mapper.AdminMapper;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminTransactionTest {

    @Test
    void transactionMethodsRollBackForCheckedExceptions() throws NoSuchMethodException {
        assertRollsBackForCheckedException("updateProfile", Long.class, AdminProfileUpdateDTO.class);
        assertRollsBackForCheckedException("changePassword", Long.class, AdminPasswordChangeDTO.class);
    }

    @Test
    void changePasswordLocksAdminBeforeCheckingOldPassword() {
        List<String> mapperCalls = new ArrayList<>();
        Admin admin = new Admin();
        admin.setId(1L);
        admin.setPassword("encoded-old-password");

        AdminMapper adminMapper = mock(AdminMapper.class, invocation -> {
            String methodName = invocation.getMethod().getName();
            mapperCalls.add(methodName);
            if (methodName.startsWith("selectById")) {
                return admin;
            }
            if (methodName.equals("changePassword")) {
                return 1;
            }
            return null;
        });
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        when(passwordEncoder.matches("old-password", "encoded-old-password")).thenReturn(true);
        when(passwordEncoder.encode("new-password")).thenReturn("encoded-new-password");

        AdminServiceImpl adminService = new AdminServiceImpl();
        ReflectionTestUtils.setField(adminService, "adminMapper", adminMapper);
        ReflectionTestUtils.setField(adminService, "passwordEncoder", passwordEncoder);

        AdminPasswordChangeDTO dto = new AdminPasswordChangeDTO();
        dto.setOldPassword("old-password");
        dto.setNewPassword("new-password");

        adminService.changePassword(1L, dto);

        assertThat(mapperCalls).contains("selectByIdForUpdate");
    }

    private void assertRollsBackForCheckedException(String methodName, Class<?>... parameterTypes)
            throws NoSuchMethodException {
        Method method = AdminServiceImpl.class.getMethod(methodName, parameterTypes);
        Transactional transactional = method.getAnnotation(Transactional.class);

        assertThat(transactional).isNotNull();
        assertThat(transactional.rollbackFor()).contains(Exception.class);
    }
}
