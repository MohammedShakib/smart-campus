package bd.ac.uiu.smartcampus.dto;

public class TeacherClassSummaryDto {
    private String courseCode;
    private String courseTitle;
    private String sectionName;

    public TeacherClassSummaryDto(String courseCode, String courseTitle, String sectionName) {
        this.courseCode = courseCode;
        this.courseTitle = courseTitle;
        this.sectionName = sectionName;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public void setCourseTitle(String courseTitle) {
        this.courseTitle = courseTitle;
    }

    public String getSectionName() {
        return sectionName;
    }

    public void setSectionName(String sectionName) {
        this.sectionName = sectionName;
    }
}
