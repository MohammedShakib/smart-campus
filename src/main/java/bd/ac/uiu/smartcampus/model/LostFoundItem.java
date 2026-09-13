package bd.ac.uiu.smartcampus.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "lost_found_items")
public class LostFoundItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ItemCategory category = ItemCategory.ELECTRONICS;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ItemType type = ItemType.FOUND; // FOUND or LOST

    @Column(nullable = false, length = 120)
    private String location; // e.g. "Room 524 Lab", "Cafeteria 2nd floor", "Library Ground Floor"

    @Column(name = "item_date", nullable = false)
    private LocalDate itemDate = LocalDate.now();

    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Column(name = "reporter_id", length = 50)
    private String reporterId;

    @Column(name = "reporter_name", length = 100)
    private String reporterName;

    @Column(name = "reporter_email", length = 100)
    private String reporterEmail;

    @Column(name = "contact_info", length = 150)
    private String contactInfo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ItemStatus status = ItemStatus.OPEN;

    @Column(name = "claimed_by_student_id", length = 50)
    private String claimedByStudentId;

    @Column(name = "claimed_by_student_name", length = 100)
    private String claimedByStudentName;

    @Column(name = "claim_proof_details", columnDefinition = "TEXT")
    private String claimProofDetails;

    @Column(name = "claim_contact_phone", length = 50)
    private String claimContactPhone;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    public enum ItemCategory {
        ELECTRONICS,
        ID_CARDS,
        KEYS,
        BOOKS_STATIONERY,
        VALUABLES,
        BAGS_CLOTHING,
        OTHER
    }

    public enum ItemType {
        LOST,
        FOUND
    }

    public enum ItemStatus {
        OPEN,
        CLAIM_PENDING,
        RESOLVED
    }

    public LostFoundItem() {
    }

    public LostFoundItem(String title, String description, ItemCategory category, ItemType type,
                         String location, LocalDate itemDate, String imageUrl,
                         String reporterId, String reporterName, String reporterEmail, String contactInfo) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.type = type;
        this.location = location;
        this.itemDate = itemDate != null ? itemDate : LocalDate.now();
        this.imageUrl = imageUrl;
        this.reporterId = reporterId;
        this.reporterName = reporterName;
        this.reporterEmail = reporterEmail;
        this.contactInfo = contactInfo;
        this.status = ItemStatus.OPEN;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ItemCategory getCategory() {
        return category;
    }

    public void setCategory(ItemCategory category) {
        this.category = category;
    }

    public ItemType getType() {
        return type;
    }

    public void setType(ItemType type) {
        this.type = type;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public LocalDate getItemDate() {
        return itemDate;
    }

    public void setItemDate(LocalDate itemDate) {
        this.itemDate = itemDate;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getReporterId() {
        return reporterId;
    }

    public void setReporterId(String reporterId) {
        this.reporterId = reporterId;
    }

    public String getReporterName() {
        return reporterName;
    }

    public void setReporterName(String reporterName) {
        this.reporterName = reporterName;
    }

    public String getReporterEmail() {
        return reporterEmail;
    }

    public void setReporterEmail(String reporterEmail) {
        this.reporterEmail = reporterEmail;
    }

    public String getContactInfo() {
        return contactInfo;
    }

    public void setContactInfo(String contactInfo) {
        this.contactInfo = contactInfo;
    }

    public ItemStatus getStatus() {
        return status;
    }

    public void setStatus(ItemStatus status) {
        this.status = status;
    }

    public String getClaimedByStudentId() {
        return claimedByStudentId;
    }

    public void setClaimedByStudentId(String claimedByStudentId) {
        this.claimedByStudentId = claimedByStudentId;
    }

    public String getClaimedByStudentName() {
        return claimedByStudentName;
    }

    public void setClaimedByStudentName(String claimedByStudentName) {
        this.claimedByStudentName = claimedByStudentName;
    }

    public String getClaimProofDetails() {
        return claimProofDetails;
    }

    public void setClaimProofDetails(String claimProofDetails) {
        this.claimProofDetails = claimProofDetails;
    }

    public String getClaimContactPhone() {
        return claimContactPhone;
    }

    public void setClaimContactPhone(String claimContactPhone) {
        this.claimContactPhone = claimContactPhone;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}
