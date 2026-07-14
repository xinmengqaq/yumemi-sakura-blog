package com.xinmengqaq.springboot.admin.service.impl;

import com.xinmengqaq.springboot.common.enums.ErrorCode;
import com.xinmengqaq.springboot.common.exception.BusinessException;
import com.xinmengqaq.springboot.admin.dto.AdminLoginDTO;
import com.xinmengqaq.springboot.admin.dto.AdminPasswordChangeDTO;
import com.xinmengqaq.springboot.admin.dto.AdminProfileUpdateDTO;
import com.xinmengqaq.springboot.admin.entity.Admin;
import com.xinmengqaq.springboot.admin.mapper.AdminMapper;
import com.xinmengqaq.springboot.admin.service.AdminService;
import com.xinmengqaq.springboot.utils.JwtUtils;
import com.xinmengqaq.springboot.admin.vo.AdminVO;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class AdminServiceImpl implements AdminService {

    @Resource
    private AdminMapper adminMapper;

    @Resource
    private PasswordEncoder passwordEncoder;

    @Resource
    private JwtUtils jwtUtils;




    @Override
     /**
     * 管理员登录校验
     * @param adminLoginDTO 包含用户名和密码的登录数据传输对象
     * @return AdminLoginVO 包含管理员登录信息的视图对象
     * @throws BusinessException 当用户名或密码错误时抛出业务异常
     */
    public AdminVO login(AdminLoginDTO adminLoginDTO) {
        // 从登录数据传输对象中获取用户名
        String username = adminLoginDTO.getUsername();

        // 记录日志，表示管理员登录开始
        log.info("管理员登录开始，username={}", username);

        // 根据用户名查询管理员信息
        Admin admin = adminMapper.selectByUsername(username);

        // 如果管理员不存在，抛出业务异常
        if (admin == null) {
            log.warn("管理员登录失败，用户名或密码错误，username={}", username);
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "用户名或密码错误");
        }

        // 验证密码是否匹配,DTO是前端传来的密码，admin是数据库的密文
        boolean passwordMatched = passwordEncoder.matches(adminLoginDTO.getPassword(), admin.getPassword());
        // 如果密码不匹配，抛出业务异常
        if (!passwordMatched) {
            log.warn("管理员登录失败，密码错误，adminId={}, username={}", admin.getId(), admin.getUsername());
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "用户名或密码错误");
        }

        // 生成管理员登录令牌
        String token = jwtUtils.createToken(admin.getId(), admin.getUsername(), admin.getPasswordVersion());

        // 记录日志，表示管理员登录成功
        log.info("管理员登录成功，adminId={}, username={}", admin.getId(), admin.getUsername());

        //给管理员视图赋值，包括登录令牌
        AdminVO adminVO = AdminVO.from(admin);
        adminVO.setToken(token);

        // 构建并返回管理员登录视图对象
        return adminVO;
    }

    /**
     * 获取当前登录管理员信息
     * @param id 管理员ID
     * @return 管理员信息不包含密码
     * @throws BusinessException 当管理员不存在时抛出业务异常
     */
    @Override
    public AdminVO getCurrentAdmin(Long id) {
        // 记录获取当前管理员信息服务层开始日志
        log.info("获取当前管理员信息服务层开始，adminId={}", id);

        // 根据管理员ID查询管理员信息
        Admin admin = validateAdminExists(id);

        // 记录获取当前管理员信息成功日志
        log.info("获取当前管理员信息服务层成功，adminId={}, username={}", admin.getId(), admin.getUsername());

        // 构建并返回管理员信息视图对象
        return AdminVO.from(admin);
    }

    /**
     * 刷新管理员登录令牌
     * @param adminId 管理员ID
     * @return 新的管理员登录令牌
     * @throws BusinessException 当管理员不存在时抛出业务异常
     */
    @Override
    public String refreshToken(Long adminId) {
        // 记录刷新管理员Token服务层开始日志
        log.info("刷新管理员Token服务层开始，adminId={}", adminId);

        Admin admin = validateAdminExists(adminId);

        // 生成新的管理员登录令牌
        String token = jwtUtils.createToken(admin.getId(), admin.getUsername(), admin.getPasswordVersion());

        // 记录刷新管理员Token服务层成功日志
        log.info("刷新管理员Token服务层成功，adminId={}", adminId);

        return token;
    }

    /**
     * 修改管理员资料
     * @param adminId 管理员ID
     * @param adminProfileUpdateDTO 包含管理员新资料的更新传输对象
     * @return 更新后的管理员信息视图对象
     * @throws BusinessException 当管理员不存在时抛出业务异常
    */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public AdminVO updateProfile(Long adminId, AdminProfileUpdateDTO adminProfileUpdateDTO) {
        // 记录修改管理员资料服务层开始日志
        log.info("修改管理员资料服务层开始，adminId={}", adminId);

        //校验管理员是否存在
        validateAdminExists(adminId);

        Admin updateAdmin = new Admin();
        updateAdmin.setId(adminId);
        updateAdmin.setName(adminProfileUpdateDTO.getName());
        updateAdmin.setUsername(adminProfileUpdateDTO.getUsername());
        updateAdmin.setAvatar(adminProfileUpdateDTO.getAvatar());

        //把数据更新到Mapper
        int rows = adminMapper.updateProfile(updateAdmin);

        //如果返回影响行数为0，说明更新失败
        if (rows == 0) {
            log.warn("更新管理员资料失败，adminId={}，行数没有变化", adminId);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "更新管理员资料失败");
        }

        log.info("修改管理员资料数据库操作完成，adminId={}", adminId);

        //返回更新后的管理员信息
        Admin admin = validateAdminExists(adminId);
        return AdminVO.from(admin);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void changePassword(Long adminId, AdminPasswordChangeDTO dto) {
        // 记录修改管理员密码服务层开始日志
        log.info("修改管理员密码服务层开始，adminId={}", adminId);

        //校验管理员是否存在
        Admin admin = validateAdminExistsForUpdate(adminId);

        // 用passwordEncoder.matches()方法验证旧密码是否正确,不匹配则抛出业务异常
        boolean oldPasswordMatched = passwordEncoder.matches(dto.getOldPassword(), admin.getPassword());
        if(!oldPasswordMatched){
            log.warn("修改管理员密码失败，旧密码错误，adminId={}", adminId);
            throw new BusinessException(ErrorCode.FORBIDDEN, "旧密码错误");
        }

        //调用passwordEncoder.encode()方法加密新密码
        String encodeNewPassword = passwordEncoder.encode(dto.getNewPassword());

        //更新数据库的管理员密码，数据库内已经自动更新密码版本号加1
        int rows = adminMapper.changePassword(adminId,encodeNewPassword);
        if (rows == 0) {
            log.warn("更新管理员密码失败，adminId={}，行数没有变化", adminId);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "更新管理员密码失败");
        }

        log.info("修改管理员密码数据库操作完成，adminId={}", adminId);
    }

    /**
     * 根据管理员ID获取管理员信息，如果管理员不存在则抛出业务异常
     * @param adminId 管理员ID
     * @return 管理员信息
     * @throws BusinessException 当管理员不存在时抛出业务异常
     */
    private Admin validateAdminExists(Long adminId) {
        // 先获取当前管理员信息
        Admin admin = adminMapper.selectById(adminId);

        return validateAdmin(adminId, admin);
    }

    /**
     * 锁定并获取管理员信息，供修改密码事务使用
     * @param adminId 管理员ID
     * @return 管理员信息
     */
    private Admin validateAdminExistsForUpdate(Long adminId) {
        Admin admin = adminMapper.selectByIdForUpdate(adminId);

        return validateAdmin(adminId, admin);
    }

    private Admin validateAdmin(Long adminId, Admin admin) {

        // 如果管理员不存在，抛出业务异常
        if (admin == null) {
            log.warn("获取管理员信息失败，管理员不存在，adminId={}", adminId);
            throw new BusinessException(ErrorCode.NOT_FOUND, "管理员不存在");
        }

        return admin;
    }

}
