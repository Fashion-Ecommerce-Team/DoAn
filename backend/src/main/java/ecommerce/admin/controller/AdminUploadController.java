package ecommerce.admin.controller;

import ecommerce.admin.dto.response.UploadResponse;
import ecommerce.admin.service.CloudinaryService;
import ecommerce.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/v1/admin/upload")
@RequiredArgsConstructor
public class AdminUploadController {
    private final CloudinaryService cloudinaryService;

    @PostMapping("/image")
    public ApiResponse<UploadResponse> uploadImage(@RequestParam("file") MultipartFile file) {
        Map<String, Object> result = cloudinaryService.uploadImage(file);

        UploadResponse res = UploadResponse.builder()
                .url((String) result.get("secure_url"))
                .publicId((String) result.get("public_id"))
                .build();

        return ApiResponse.success("Tải hình ảnh lên hệ thống thành công", res);
    }

    @PostMapping("/images")
    public ApiResponse<List<UploadResponse>> uploadMultipleImages(@RequestParam("files") List<MultipartFile> files) {
        List<Map<String, Object>> results = cloudinaryService.uploadMultipleImages(files);

        List<UploadResponse> responses = new ArrayList<>();
        for (Map<String, Object> result : results) {
            responses.add(UploadResponse.builder()
                    .url((String) result.get("secure_url"))
                    .publicId((String) result.get("public_id"))
                    .build());
        }

        return ApiResponse.success("Tải danh sách hình ảnh lên thành công", responses);
    }
}
