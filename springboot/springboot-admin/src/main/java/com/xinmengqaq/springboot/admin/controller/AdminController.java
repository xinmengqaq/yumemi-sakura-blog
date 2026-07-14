package com.xinmengqaq.springboot.admin.controller;

import com.xinmengqaq.springboot.common.Result;
import com.xinmengqaq.springboot.common.enums.ErrorCode;
import com.xinmengqaq.springboot.common.exception.BusinessException;
import com.xinmengqaq.springboot.admin.dto.AdminLoginDTO;
import com.xinmengqaq.springboot.admin.dto.AdminPasswordChangeDTO;
import com.xinmengqaq.springboot.admin.dto.AdminProfileUpdateDTO;
import com.xinmengqaq.springboot.admin.service.AdminService;
import com.xinmengqaq.springboot.admin.vo.AdminVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@Tag(name = "管理员模块/管理员管理", description = "后台管理员登录认证和资料管理接口")
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Resource
    private AdminService adminService;

    /**
    * 管理员登录接口
    * 该接口用于管理员登录系统，验证用户名和密码
    * 登录成功后返回包含Token的响应对象
    * @param adminLoginDTO 包含管理员用户名和密码的数据传输对象
    * @return 返回登录结果，包含Token信息
    */
    @Operation(summary = "管理员登录",description = "管理员输入用户名和密码，登录成功后返回 Token")
    @PostMapping("/login")
    public Result login(@Valid @RequestBody AdminLoginDTO adminLoginDTO){
        // 记录管理员登录请求日志，包含用户名信息
        log.info("收到管理员登录请求，username={}", adminLoginDTO.getUsername());

        // 调用服务层方法处理登录逻辑，返回登录结果对象
        AdminVO adminVO = adminService.login(adminLoginDTO);

        // 记录管理员登录接口处理完成日志，包含用户名信息
        log.info("管理员登录接口处理完成，username={}", adminLoginDTO.getUsername());

        // 返回成功响应，包含登录结果对象
        return Result.success(adminVO);
    }

    /**
     * 管理员退出登录接口
     * 该接口用于管理员退出登录系统，清除管理员的登录状态
     * @return 返回退出成功消息
     */
    @Operation(summary = "管理员退出登录",description = "管理员点击退出登录按钮，系统会清除管理员的登录状态")
    @PostMapping("/logout")
    public Result logout(){

        // 记录管理员退出登录请求日志
        log.info("管理员退出登录");

        // 调用服务层方法处理退出登录逻辑
        Result result = Result.success();

        // 设置退出成功消息
        result.setMsg("退出成功");
        return result;
    }

    /**
     * 获取当前登录管理员资料接口
     * @param request HTTP请求对象，包含管理员ID信息
     * @return 管理员资料视图对象，不包含密码信息
     */
    @Operation(summary = "获取当前登录管理员信息",description = "管理员点击获取当前登录管理员信息按钮，系统会返回当前登录管理员的用户名、角色等信息")
    @GetMapping("/profile")
    public Result profile(HttpServletRequest request){

        // 从请求中获取管理员ID
        Long adminId = resolveAdminId(request);

        // 记录获取当前管理员信息请求日志
        log.info("获取当前管理员信息请求，adminId={}", adminId);

        // 调用服务层方法获取当前登录管理员信息
        AdminVO adminVO = adminService.getCurrentAdmin(adminId);

        // 记录获取当前管理员信息成功日志
        log.info("获取当前管理员信息成功，adminId={}", adminId);

        return Result.success(adminVO);
    }

    /**
     * 修改管理员资料接口
     * @param adminProfileUpdateDTO 包含管理员新资料的传输对象
     * @param request HTTP请求对象，包含管理员ID信息
     * @return 更新后的管理员资料视图对象，包含更新后的用户名、角色等信息
     */
    @Operation(summary = "修改管理员资料",description = "管理员点击更新资料按钮，系统会根据管理员输入的资料信息更新管理员的用户名、角色等信息")
    @PutMapping("/profile")
    public Result updateProfile(@Valid @RequestBody AdminProfileUpdateDTO adminProfileUpdateDTO, HttpServletRequest request){
        //从请求中获取管理员ID
        Long adminId = resolveAdminId(request);

        // 记录修改管理员资料请求日志
        log.info("收到修改管理员资料请求，adminId={}", adminId);

        //调用修改管理员资料方法
        AdminVO adminVO = adminService.updateProfile(adminId, adminProfileUpdateDTO);

        // 记录修改管理员资料成功日志
        log.info("修改管理员资料成功，adminId={}", adminId);

        //返回成功响应
        return Result.success(adminVO);
    }

    /**
     * 修改管理员密码接口
     * @param adminPasswordChangeDTO 包含管理员旧密码和新密码的传输对象
     * @param request HTTP请求对象，包含管理员ID信息
     * @return 修改密码成功消息
     */
    @Operation(summary = "修改管理员密码",description = "管理员点击修改密码按钮，系统会根据管理员输入的旧密码和新密码更新管理员的密码")
    @PatchMapping("/profile/password")
    public Result changePassword(@Valid @RequestBody AdminPasswordChangeDTO adminPasswordChangeDTO,
                                 HttpServletRequest request){
        //从请求中获取管理员ID
        Long adminId = resolveAdminId(request);

        // 记录修改管理员密码请求日志
        log.info("收到修改管理员密码请求，adminId={}", adminId);

        //调用changePassword方法
        adminService.changePassword(adminId, adminPasswordChangeDTO);

        // 记录修改管理员密码成功日志
        log.info("修改管理员密码成功，adminId={}", adminId);

        //返回成功响应
        Result result = Result.success();
        result.setMsg("密码修改成功");

        return result;
    }
    /**
     * 验证管理员登录状态接口
     * @return 管理员登录状态
     */
    @Operation(summary = "验证管理员登录状态",description = "管理员点击验证登录状态按钮，系统会返回当前登录管理员的登录状态")
    @GetMapping("/validate")
    public Result validateToken(){
        // 记录验证管理员登录状态请求日志
        log.info("收到验证管理员登录状态请求");

        // 返回登录状态
        return Result.success(Map.of("valid", true));
    }

    /**
     * 刷新管理员登录接口
     * @param request HTTP请求对象，包含管理员ID信息
     * @return 刷新后的Token视图对象，包含刷新后的Token信息
     */
    @Operation(summary = "刷新管理员登录Token",description = "管理员点击刷新登录Token按钮，系统会返回新的登录Token")
    @PostMapping("/refresh")
    public Result refreshToken(HttpServletRequest request){

        // 从请求中获取管理员ID
        Long adminId = resolveAdminId(request);

        // 记录刷新管理员Token请求日志
        log.info("收到刷新管理员Token请求，adminId={}", adminId);

        // 调用服务层方法刷新 Token
        String token = adminService.refreshToken(adminId);

        // 记录刷新管理员Token成功日志
        log.info("刷新管理员Token成功，adminId={}", adminId);

        // 返回刷新后的 Token
        return Result.success(Map.of("token", token));
    }

    /**
     * 从请求上下文中解析管理员ID
     * @param request HTTP请求对象
     * @return 管理员ID
     */
    private Long resolveAdminId(HttpServletRequest request) {
        Long adminId = (Long) request.getAttribute("adminId");
        if (adminId == null) {
            log.warn("请求上下文中未找到管理员ID");
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "未登录或登录已过期");
        }
        return adminId;
    }

}
