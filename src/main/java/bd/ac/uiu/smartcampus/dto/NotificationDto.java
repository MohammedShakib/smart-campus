package bd.ac.uiu.smartcampus.dto;

import bd.ac.uiu.smartcampus.model.UserNotification;

import java.time.LocalDateTime;

public class NotificationDto {
    private Long id;
    private String type;
    private String title;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
    private String targetSection;
    private String referenceId;

    public NotificationDto() {
    }

    public NotificationDto(UserNotification notification) {
        this.id = notification.getId();
        this.type = notification.getType().name();
        this.title = notification.getTitle();
        this.message = notification.getMessage();
        this.read = notification.isRead();
        this.createdAt = notification.getCreatedAt();
        this.targetSection = notification.getTargetSection();
        this.referenceId = notification.getReferenceId();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getTargetSection() { return targetSection; }
    public void setTargetSection(String targetSection) { this.targetSection = targetSection; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }
}
