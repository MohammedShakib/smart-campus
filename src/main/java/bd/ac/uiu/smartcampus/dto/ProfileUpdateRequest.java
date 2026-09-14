package bd.ac.uiu.smartcampus.dto;

import jakarta.validation.constraints.Size;

public class ProfileUpdateRequest {

    @Size(max = 500, message = "Profile image URL is too long")
    private String profileImageUrl;

    public ProfileUpdateRequest() {
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }
}
