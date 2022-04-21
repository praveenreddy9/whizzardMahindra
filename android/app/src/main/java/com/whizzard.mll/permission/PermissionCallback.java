package com.whizzard.mll.permission;


public interface PermissionCallback {
    void onPermissionResult(boolean granted, boolean neverAsk);
}