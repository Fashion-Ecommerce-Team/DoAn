package ecommerce.admin.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import ecommerce.admin.service.CloudinaryService;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class CloudinaryServiceImpl implements CloudinaryService {
    private final Cloudinary cloudinary;

    @Override
    public Map<String, Object> uploadImage(MultipartFile file) {
        try {
            return cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
        } catch (IOException e) {
            throw new RuntimeException("Ảnh tải lên thất bại");    
            // throw new RuntimeException("Image upload failed");
        }
    }

    @Override
    public List<Map<String, Object>> uploadMultipleImages(List<MultipartFile> files) {
        List<Map<String, Object>> uploadedImages = new ArrayList<>();
        for (MultipartFile file : files) {
            try {
                Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
                uploadedImages.add(uploadResult);
            } catch (IOException e) {
                throw new RuntimeException("Ảnh tải lên thất bại");    
                // throw new RuntimeException("Image upload failed");
            }
        }
        return uploadedImages;
    }

    @Override
    public Map<String, Object> deleteImage(String publicId) {
        try {
            return cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            throw new RuntimeException("Xóa ảnh thất bại");
        }
    }

    @Override
    public String extractPublicIdFromUrl(String url) {
        if (url == null || url.isEmpty()) return null;
        try {
            int uploadIndex = url.indexOf("/upload/");
            if (uploadIndex == -1) return null;
            
            String path = url.substring(uploadIndex + 8);
            if (path.matches("^v\\d+/.*")) {
                path = path.replaceFirst("^v\\d+/", "");
            }
            
            int lastDotIndex = path.lastIndexOf(".");
            if (lastDotIndex != -1) {
                path = path.substring(0, lastDotIndex);
            }
            return path;
        } catch (Exception e) {
            return null;
        }
    }
}