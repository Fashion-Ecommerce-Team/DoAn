package ecommerce.auth.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    public boolean sendOtpEmail(String toEmail, String fullName, String otpCode, String purposeTitle) {
        log.info("============================================================");
        log.info(" [SEEME OTP] Email: {} | Mục đích: {} | Mã OTP: {}", toEmail, purposeTitle, otpCode);
        log.info("============================================================");

        if (mailSender == null
                || mailUsername == null || mailUsername.isBlank()
                || mailUsername.contains("your_email")
                || mailPassword == null || mailPassword.isBlank()
                || mailPassword.contains("your_email_password")) {
            log.warn("Chưa cấu hình tài khoản SMTP (MAIL_USERNAME / MAIL_PASSWORD). Hệ thống sử dụng chế độ OTP Console/Dev.");
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailUsername, "SEEME® Streetwear");
            helper.setTo(toEmail);
            helper.setSubject("[SEEME®] " + purposeTitle + " - Mã xác thực: " + otpCode);

            String displayName = (fullName != null && !fullName.isBlank()) ? fullName : toEmail;
            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e5e5e5; padding: 32px; background-color: #ffffff; color: #171717;">
                  <div style="text-align: center; border-bottom: 1px solid #f0f0f0; padding-bottom: 18px; margin-bottom: 24px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px;">SEEME®</h1>
                    <p style="margin: 4px 0 0; font-size: 11px; color: #737373; letter-spacing: 2px;">madeinvietnam</p>
                  </div>
                  <h2 style="font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">%s</h2>
                  <p style="font-size: 14px; line-height: 1.6; color: #404040;">Xin chào <strong>%s</strong>,</p>
                  <p style="font-size: 14px; line-height: 1.6; color: #404040;">
                    Mã xác thực OTP của bạn tại hệ thống <strong>SEEME®</strong> là:
                  </p>
                  <div style="margin: 24px 0; padding: 18px; background-color: #f5f5f5; border: 1px dashed #171717; text-align: center;">
                    <span style="font-size: 28px; font-weight: 900; letter-spacing: 8px; color: #000000;">%s</span>
                  </div>
                  <p style="font-size: 12px; color: #737373; line-height: 1.5;">
                    * Mã xác thực này có hiệu lực trong vòng <strong>05 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.
                  </p>
                  <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #f0f0f0; font-size: 11px; color: #a3a3a3; text-align: center;">
                    © SEEME® Streetwear Vietnam. All rights reserved.
                  </div>
                </div>
                """.formatted(purposeTitle, displayName, otpCode);

            helper.setText(html, true);
            mailSender.send(message);
            return true;
        } catch (Exception ex) {
            log.warn("Không thể gửi email qua SMTP ({}). Sử dụng fallback OTP.", ex.getMessage());
            return false;
        }
    }
}
