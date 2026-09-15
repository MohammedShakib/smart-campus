package bd.ac.uiu.smartcampus.model;

import jakarta.persistence.*;

@Entity
@Table(name = "teacher_profiles")
public class TeacherProfile {

    @Id
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(length = 100)
    private String designation;

    @Column(length = 50)
    private String officeRoom;

    public TeacherProfile() {
    }

    public TeacherProfile(User user, String designation, String officeRoom) {
        this.user = user;
        this.designation = designation;
        this.officeRoom = officeRoom;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getOfficeRoom() {
        return officeRoom;
    }

    public void setOfficeRoom(String officeRoom) {
        this.officeRoom = officeRoom;
    }
}
