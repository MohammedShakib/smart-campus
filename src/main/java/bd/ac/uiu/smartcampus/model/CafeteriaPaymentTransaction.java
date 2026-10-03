package bd.ac.uiu.smartcampus.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cafeteria_payment_transactions")
public class CafeteriaPaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String transactionId;

    @Column(nullable = false, length = 30)
    private String paymentMethod;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false)
    private int totalItems;

    @Lob
    @Column(nullable = false)
    private String itemsSummary;

    @Column(nullable = false, length = 120)
    private String studentEmail;

    @Column(length = 40)
    private String studentId;

    @Column(nullable = false, length = 120)
    private String studentName;

    @Column(length = 80)
    private String gatewaySessionKey;

    @Column(length = 120)
    private String gatewayValidationId;

    @Column(length = 80)
    private String gatewayBankTransactionId;

    @Column(length = 80)
    private String gatewayCardType;

    @Column(length = 255)
    private String gatewayResponse;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime paidAt;

    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public int getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(int totalItems) {
        this.totalItems = totalItems;
    }

    public String getItemsSummary() {
        return itemsSummary;
    }

    public void setItemsSummary(String itemsSummary) {
        this.itemsSummary = itemsSummary;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getGatewaySessionKey() {
        return gatewaySessionKey;
    }

    public void setGatewaySessionKey(String gatewaySessionKey) {
        this.gatewaySessionKey = gatewaySessionKey;
    }

    public String getGatewayValidationId() {
        return gatewayValidationId;
    }

    public void setGatewayValidationId(String gatewayValidationId) {
        this.gatewayValidationId = gatewayValidationId;
    }

    public String getGatewayBankTransactionId() {
        return gatewayBankTransactionId;
    }

    public void setGatewayBankTransactionId(String gatewayBankTransactionId) {
        this.gatewayBankTransactionId = gatewayBankTransactionId;
    }

    public String getGatewayCardType() {
        return gatewayCardType;
    }

    public void setGatewayCardType(String gatewayCardType) {
        this.gatewayCardType = gatewayCardType;
    }

    public String getGatewayResponse() {
        return gatewayResponse;
    }

    public void setGatewayResponse(String gatewayResponse) {
        this.gatewayResponse = gatewayResponse;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
