package com.whizzard.mll;

import androidx.core.app.ActivityCompat;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.whizzard.mll.permission.Permission;
import com.whizzard.mll.permission.PermissionCallback;
import com.whizzard.mll.service.LocationTrackingService;
import com.whizzard.mll.util.Trace;

import java.util.jar.Manifest;

public class WhizzardLocationModule extends ReactContextBaseJavaModule {

    private static final int PERMISSION_REQUEST_CODE = 27;
    private PermissionCallback permissionCallback;

    public WhizzardLocationModule(ReactApplicationContext reactContext) {
        super(reactContext); //required by React Native
    }

    @Override
    //getName is required to define the name of the module represented in JavaScript
    public String getName() {
        return "LocationService";
    }

    @ReactMethod
    private void ReactCustom(Callback errorCallback, Callback successCallback) {
        Trace.d("Welcome to JAVA Function" + getCurrentActivity());
        LocationTrackingService.startService(getCurrentActivity());
    }

    @ReactMethod
    public void startLocation(Callback errorCallback, Callback successCallback) {
        try {
            System.out.println("Locaiton Start");
            LocationTrackingService.startService(MainApplication.getInstance());
            successCallback.invoke("LOCATION_STARTED");
        } catch (IllegalViewOperationException e) {
            errorCallback.invoke(e.getMessage());
        }
    }

    @ReactMethod
    public void isLocationRunning(Callback errorCallback, Callback successCallback) {
        try {
            System.out.println("Locaiton Start");
            successCallback.invoke(LocationTrackingService.isRunning());
        } catch (IllegalViewOperationException e) {
            errorCallback.invoke(e.getMessage());
        }
    }

    @ReactMethod
    public void stopLocation(Callback errorCallback, Callback successCallback) {
        try {
            System.out.println("location End");
            LocationTrackingService.stopService(MainApplication.getInstance());
            successCallback.invoke("LOCATION_ENDED");
        } catch (IllegalViewOperationException e) {
            errorCallback.invoke(e.getMessage());
        }
    }
 }
