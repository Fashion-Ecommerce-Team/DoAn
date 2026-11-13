package ecommerce.admin.dto.response;

import lombok.Data;

@Data
public class ProductImageResponse {
    private Long id;
    private String url;
    private String imageUrl;
    private Integer displayOrder;
    private Boolean isPrimary;

    public String getImageUrl() {
        return imageUrl != null ? imageUrl : url;
    }

    public void setUrl(String url) {
        this.url = url;
        if (this.imageUrl == null) {
            this.imageUrl = url;
        }
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
        if (this.url == null) {
            this.url = imageUrl;
        }
    }
}
