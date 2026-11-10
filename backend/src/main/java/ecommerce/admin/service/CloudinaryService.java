package ecommerce.admin.service;

import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
import java.util.List;

public interface CloudinaryService {
    Map<String, Object> uploadImage(MultipartFile file);
    List<Map<String, Object>> uploadMultipleImages(List<MultipartFile> files);
    Map<String, Object> deleteImage(String publicId);
    String extractPublicIdFromUrl(String url);

    /**
     * Upload các file tài liệu dạng thô (PDF, Word, DOCX...) lên Cloudinary với resource_type = raw
     */
    Map<String, Object> uploadFile(MultipartFile file, String folderName);
    Map<String, Object> deleteFile(String publicId);
}
