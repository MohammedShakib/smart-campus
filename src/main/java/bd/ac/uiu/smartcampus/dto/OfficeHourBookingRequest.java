package bd.ac.uiu.smartcampus.dto;

public class OfficeHourBookingRequest {

    private Long slotId;
    private String queryCategory; // Mandatory: "Theory Clarification", "Project Consultation", "Exam Review", "General Advising", "Other"
    private String queryTopic;    // Mandatory: e.g. "Polymorphism vs Strategy Pattern implementation query"
    private String queryDetails;  // Mandatory: Specific context, questions, code links or problem statement

    public OfficeHourBookingRequest() {
    }

    public Long getSlotId() {
        return slotId;
    }

    public void setSlotId(Long slotId) {
        this.slotId = slotId;
    }

    public String getQueryCategory() {
        return queryCategory;
    }

    public void setQueryCategory(String queryCategory) {
        this.queryCategory = queryCategory;
    }

    public String getQueryTopic() {
        return queryTopic;
    }

    public void setQueryTopic(String queryTopic) {
        this.queryTopic = queryTopic;
    }

    public String getQueryDetails() {
        return queryDetails;
    }

    public void setQueryDetails(String queryDetails) {
        this.queryDetails = queryDetails;
    }
}
