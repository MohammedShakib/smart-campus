package bd.ac.uiu.smartcampus.dto;

public class LostFoundClaimRequest {

    private String claimProofDetails;
    private String contactPhone;

    public LostFoundClaimRequest() {
    }

    public String getClaimProofDetails() {
        return claimProofDetails;
    }

    public void setClaimProofDetails(String claimProofDetails) {
        this.claimProofDetails = claimProofDetails;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }
}
