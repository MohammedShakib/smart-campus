package bd.ac.uiu.smartcampus.model;

public enum Role {
    ROLE_ADMIN("Admin / Control Center"),
    ROLE_TEACHER("Faculty / Instructor"),
    ROLE_STUDENT("Student / Learner"),
    ROLE_SECURITY("Campus Security & Safety");

    private final String displayName;

    Role(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
