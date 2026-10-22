package ecommerce.admin.controller;

import ecommerce.admin.dto.response.BannerResponse;
import ecommerce.admin.service.BannerService;
import ecommerce.common.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** API công khai cho trang shop: chỉ trả banner ACTIVE, sắp theo displayOrder. */
@RestController
@RequestMapping("/api/v1/banners")
public class PublicBannerController {
    @Autowired
    private BannerService service;

    @GetMapping
    public ApiResponse<List<BannerResponse>> getActive(@RequestParam(required = false) String position) {
        return ApiResponse.success("Lấy danh sách banner thành công", service.getActiveByPosition(position));
    }
}
