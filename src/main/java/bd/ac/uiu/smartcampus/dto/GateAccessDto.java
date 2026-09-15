package bd.ac.uiu.smartcampus.dto;

public class GateAccessDto {
    private String identifier; // Student/Employee ID or email
    private String accessType; // ENTRY or EXIT
    private String gateName;   // e.g., "Main Gate"

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public String getAccessType() {
        return accessType;
    }

    public void setAccessType(String accessType) {
        this.accessType = accessType;
    }

    public String getGateName() {
        return gateName;
    }

    public void setGateName(String gateName) {
        this.gateName = gateName;
    }
}
