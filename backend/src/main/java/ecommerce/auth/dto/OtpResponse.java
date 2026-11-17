package ecommerce.auth.dto;

public class OtpResponse {

    private String email;
    private int expiresInSeconds;
    private boolean mailSent;
    private String devOtp;

    public OtpResponse() {
    }

    public OtpResponse(String email, int expiresInSeconds, boolean mailSent, String devOtp) {
        this.email = email;
        this.expiresInSeconds = expiresInSeconds;
        this.mailSent = mailSent;
        this.devOtp = devOtp;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public int getExpiresInSeconds() {
        return expiresInSeconds;
    }

    public void setExpiresInSeconds(int expiresInSeconds) {
        this.expiresInSeconds = expiresInSeconds;
    }

    public boolean isMailSent() {
        return mailSent;
    }

    public void setMailSent(boolean mailSent) {
        this.mailSent = mailSent;
    }

    public String getDevOtp() {
        return devOtp;
    }

    public void setDevOtp(String devOtp) {
        this.devOtp = devOtp;
    }
}
