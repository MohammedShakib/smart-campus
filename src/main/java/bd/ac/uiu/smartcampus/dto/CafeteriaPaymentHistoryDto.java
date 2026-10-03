package bd.ac.uiu.smartcampus.dto;

import bd.ac.uiu.smartcampus.model.CafeteriaPaymentTransaction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CafeteriaPaymentHistoryDto {

    private Long id;
    private String transactionId;
    private String paymentMethod;
    private String status;
    private BigDecimal totalAmount;
    private int totalItems;
    private String itemsSummary;
    private String gatewayCardType;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    public static CafeteriaPaymentHistoryDto from(CafeteriaPaymentTransaction transaction) {
        CafeteriaPaymentHistoryDto dto = new CafeteriaPaymentHistoryDto();
        dto.id = transaction.getId();
        dto.transactionId = transaction.getTransactionId();
        dto.paymentMethod = transaction.getPaymentMethod();
        dto.status = transaction.getStatus();
        dto.totalAmount = transaction.getTotalAmount();
        dto.totalItems = transaction.getTotalItems();
        dto.itemsSummary = transaction.getItemsSummary();
        dto.gatewayCardType = transaction.getGatewayCardType();
        dto.createdAt = transaction.getCreatedAt();
        dto.paidAt = transaction.getPaidAt();
        return dto;
    }

    public Long getId() {
        return id;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public String getStatus() {
        return status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public int getTotalItems() {
        return totalItems;
    }

    public String getItemsSummary() {
        return itemsSummary;
    }

    public String getGatewayCardType() {
        return gatewayCardType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }
}
