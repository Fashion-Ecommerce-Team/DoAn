package ecommerce.admin.util;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

public class TextChunkerUtil {

    public static final int DEFAULT_CHUNK_SIZE_WORDS = 350;
    public static final int DEFAULT_OVERLAP_WORDS = 50;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChunkItem {
        private int index;
        private String text;
        private int charStart;
        private int charEnd;
        private int wordCount;
    }

    public static List<ChunkItem> chunkText(String fullText) {
        return chunkText(fullText, DEFAULT_CHUNK_SIZE_WORDS, DEFAULT_OVERLAP_WORDS);
    }

    /**
     * Cắt chuỗi văn bản thành danh sách các đoạn nhỏ có gối đầu (overlap)
     * và tính toán chính xác charStart, charEnd trong văn bản gốc.
     */
    public static List<ChunkItem> chunkText(String fullText, int chunkSizeWords, int overlapWords) {
        List<ChunkItem> result = new ArrayList<>();
        if (fullText == null || fullText.isBlank()) {
            return result;
        }

        if (chunkSizeWords <= 0) chunkSizeWords = DEFAULT_CHUNK_SIZE_WORDS;
        if (overlapWords < 0 || overlapWords >= chunkSizeWords) overlapWords = DEFAULT_OVERLAP_WORDS;

        // Lưu danh sách các token (từ) kèm vị trí bắt đầu và kết thúc trong fullText
        List<WordToken> tokens = tokenizeWithPositions(fullText);
        if (tokens.isEmpty()) {
            return result;
        }

        int chunkIndex = 0;
        int startToken = 0;

        while (startToken < tokens.size()) {
            int endToken = Math.min(startToken + chunkSizeWords, tokens.size());

            int charStart = tokens.get(startToken).start;
            int charEnd = tokens.get(endToken - 1).end;

            String chunkText = fullText.substring(charStart, charEnd).trim();
            int wordCount = endToken - startToken;

            result.add(ChunkItem.builder()
                    .index(chunkIndex++)
                    .text(chunkText)
                    .charStart(charStart)
                    .charEnd(charEnd)
                    .wordCount(wordCount)
                    .build());

            if (endToken >= tokens.size()) {
                break;
            }

            startToken += (chunkSizeWords - overlapWords);
        }

        return result;
    }

    private static class WordToken {
        int start;
        int end;

        WordToken(int start, int end) {
            this.start = start;
            this.end = end;
        }
    }

    /**
     * Tách văn bản thành các từ và lưu lại tọa độ ký tự chính xác
     */
    private static List<WordToken> tokenizeWithPositions(String text) {
        List<WordToken> tokens = new ArrayList<>();
        int len = text.length();
        int i = 0;

        while (i < len) {
            // Bỏ qua khoảng trắng
            while (i < len && Character.isWhitespace(text.charAt(i))) {
                i++;
            }
            if (i >= len) break;

            int wordStart = i;
            // Tìm điểm kết thúc của từ
            while (i < len && !Character.isWhitespace(text.charAt(i))) {
                i++;
            }
            int wordEnd = i;
            tokens.add(new WordToken(wordStart, wordEnd));
        }

        return tokens;
    }
}
