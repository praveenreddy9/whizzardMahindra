package com.whizzard.mll.util;

public class ApiRequest {
    private String deviceId;
    private String userId;
    private String shiftId;
    private double latitude;
    private double longitude;

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getShiftId() {
        return getShiftId();
    }

    public void setShiftId(String shiftId) {
        this.shiftId = shiftId;
    }


    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }
}
