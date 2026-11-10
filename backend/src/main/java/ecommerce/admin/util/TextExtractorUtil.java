package ecommerce.admin.util;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class TextExtractorUtil {

    /**
     * Bóc tách toàn bộ nội dung chữ thô từ file MultipartFile (.pdf, .docx, .txt, .md)
     */
    public static String extractText(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File tài liệu không được để trống!");
        }

        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new IllegalArgumentException("Tên file không hợp lệ!");
        }

        String lowerName = filename.toLowerCase();
        String text;

        if (lowerName.endsWith(".pdf")) {
            text = extractFromPdf(file.getBytes());
        } else if (lowerName.endsWith(".docx")) {
            text = extractFromDocx(file.getInputStream());
        } else if (lowerName.endsWith(".txt") || lowerName.endsWith(".md")) {
            text = new String(file.getBytes(), StandardCharsets.UTF_8);
        } else {
            throw new IllegalArgumentException("Hệ thống chỉ hỗ trợ định dạng file .pdf, .docx, .txt, .md");
        }

        return cleanText(text);
    }

    private static String extractFromPdf(byte[] bytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(document);
        }
    }

    private static String extractFromDocx(InputStream inputStream) throws IOException {
        try (XWPFDocument document = new XWPFDocument(inputStream);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    /**
     * Làm sạch văn bản: chuẩn hóa xuống dòng, loại bỏ ký tự rác nhị phân
     */
    public static String cleanText(String text) {
        if (text == null) return "";
        return text.replace("\r\n", "\n")
                   .replace("\r", "\n")
                   .replaceAll("[\\t\\x0B\\f]", " ")
                   .replaceAll(" +", " ")
                   .replaceAll("\n{3,}", "\n\n")
                   .trim();
    }
}
