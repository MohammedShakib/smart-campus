package bd.ac.uiu.smartcampus.dto;

import java.math.BigDecimal;

public class CafeteriaCheckoutResponse {

    private String transactionId;
    private String paymentMethod;
    private String status;
    private BigDecimal totalAmount;
    private String gatewayUrl;
    private String message;

    public CafeteriaCheckoutResponse() {
    }

    public CafeteriaCheckoutResponse(String transactionId, String paymentMethod, String status,
                                     BigDecimal totalAmount, String gatewayUrl, String message) {
        this.transactionId = transactionId;
        this.paymentMethod = paymentMethod;
        this.status = status;
        this.totalAmount = totalAmount;
        this.gatewayUrl = gatewayUrl;
        this.message = message;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getGatewayUrl() {
        return gatewayUrl;
    }

    public void setGatewayUrl(String gatewayUrl) {
        this.gatewayUrl = gatewayUrl;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
