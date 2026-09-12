package bd.ac.uiu.smartcampus.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "campus_notices")
public class CampusNotice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 50)
    private String category; // ACADEMIC, EMERGENCY, TRANSPORT, EVENT, GENERAL

    @Column(length = 30)
    private String priority; // HIGH, MEDIUM, LOW

    @Column(nullable = false)
    private String postedBy;

    @Column(nullable = false)
    private LocalDateTime postedAt = LocalDateTime.now();

    public CampusNotice() {
    }

    public CampusNotice(String title, String content, String category, String priority, String postedBy) {
        this.title = title;
        this.content = content;
        this.category = category;
        this.priority = priority;
        this.postedBy = postedBy;
        this.postedAt = LocalDateTime.now();
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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getPostedBy() {
        return postedBy;
    }

    public void setPostedBy(String postedBy) {
        this.postedBy = postedBy;
    }

    public LocalDateTime getPostedAt() {
        return postedAt;
    }

    public void setPostedAt(LocalDateTime postedAt) {
        this.postedAt = postedAt;
    }
}
