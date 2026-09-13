package bd.ac.uiu.smartcampus.dto;

public class OfficeHourSlotCreateRequest {

    private String roomNumber;
    private String slotDate;  // YYYY-MM-DD
    private String startTime; // HH:mm (e.g. 14:00)
    private String endTime;   // HH:mm (e.g. 14:30)
    private String dayOfWeek;

    public OfficeHourSlotCreateRequest() {
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getSlotDate() {
        return slotDate;
    }

    public void setSlotDate(String slotDate) {
        this.slotDate = slotDate;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }
}
