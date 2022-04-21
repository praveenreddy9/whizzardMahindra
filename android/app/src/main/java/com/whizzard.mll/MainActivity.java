package com.whizzard.mll;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentSender;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;

import com.facebook.react.ReactActivity;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.ResolvableApiException;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.LocationSettingsResponse;
import com.google.android.gms.location.LocationSettingsStatusCodes;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.whizzard.mll.constants.IntentConstants;
import com.whizzard.mll.permission.Permission;
import com.whizzard.mll.permission.PermissionCallback;
import com.whizzard.mll.permission.PermissionUtils;
import com.whizzard.mll.service.LocationTrackingService;
import com.whizzard.mll.util.Trace;

import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;

public class MainActivity extends ReactActivity  {

    private static final int PERMISSION_REQUEST_CODE = 27;
    private PermissionCallback permissionCallback;
    private static final int REQUEST_CHECK_SETTINGS = 101;
    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "Whizzard.mll";
    }

    @Override
    protected void onStart() {
        super.onStart( );
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            createChannels( );
        }
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegate(this, getMainComponentName( )) {
            @Override
            protected ReactRootView createRootView() {
                return new RNGestureHandlerEnabledRootView(MainActivity.this);
            }
        };
    }

    @Override
    protected void onResume() {
        super.onResume( );
//        requestPermissions();
    }

    @Override
    protected void onStop() {
        super.onStop( );
    }

    private void requestPermissions() {
        requestPermission(Permission.FINE_LOCATION, new PermissionCallback( ) {
            @Override
            public void onPermissionResult(boolean granted, boolean neverAsk) {
                if (granted) {
//                    enableGPSAutoMatically();
                } else {
                    requestPermissions( );
                }
            }
        });
    }



    @RequiresApi(api = Build.VERSION_CODES.O)
    private void createChannels() {
        NotificationChannel connectionChannel = new NotificationChannel(IntentConstants.NOTIFY_CHANNEL_ID,
                IntentConstants.NOTIFY_CHANNEL_NAME, NotificationManager.IMPORTANCE_MIN);
        connectionChannel.enableLights(false);
        connectionChannel.enableVibration(false);
        connectionChannel.setShowBadge(false);
        connectionChannel.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
        ((NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE)).createNotificationChannel(connectionChannel);

    }

    private void startLocationService() {
        // LocationTrackingService.startService(this);
    }

    private void stopLocationService() {
        LocationTrackingService.stopService(this);
    }

    public void requestPermission(Permission permission, PermissionCallback permissionCallback) {
        this.permissionCallback = permissionCallback;
        if (permissionCallback != null && !isFinishing( )) {
            if (!PermissionUtils.isGranted(this, permission)) {
                ActivityCompat.requestPermissions(this, new String[]{permission.toString( )}, PERMISSION_REQUEST_CODE);
            } else {
                permissionCallback.onPermissionResult(true, false);
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        onPermissionsResult(requestCode, permissions, grantResults);
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    private void onPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == PERMISSION_REQUEST_CODE && grantResults != null && permissions != null) {
            for (int i = 0; i < grantResults.length; i++) {
                if (permissionCallback != null) {
                    permissionCallback.onPermissionResult(grantResults[i] == PackageManager.PERMISSION_GRANTED,
                            !PermissionUtils.shouldShowRequestPermissionRationale(this, permissions[i]));
                }
            }
        }
    }


    private void enableGPSAutoMatically() {
            LocationRequest locationRequest = LocationRequest.create();
            locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
//            locationRequest.setInterval(30 * 1000);
//            locationRequest.setFastestInterval(5 * 1000);
            LocationSettingsRequest.Builder builder = new LocationSettingsRequest.Builder()
                    .addLocationRequest(locationRequest);

            // **************************
            builder.setAlwaysShow(true); // this is the key ingredient
            // **************************

            Task<LocationSettingsResponse> task =
                    LocationServices.getSettingsClient(this).checkLocationSettings(builder.build());
            task.addOnCompleteListener(new OnCompleteListener<LocationSettingsResponse>() {
                @Override
                public void onComplete(Task<LocationSettingsResponse> task) {
                    try {
                        LocationSettingsResponse response = task.getResult(ApiException.class);
                        // All location settings are satisfied. The client can initialize location
                        // requests here.

                    } catch (ApiException exception) {
                        switch (exception.getStatusCode()) {
                            case LocationSettingsStatusCodes.SUCCESS:
                                // All location settings are satisfied. The client can
                                // initialize location
                                // requests here.
                                break;
                            case LocationSettingsStatusCodes.RESOLUTION_REQUIRED:
                                Trace.i("GPS is not on");
                                // Location settings are not satisfied. But could be fixed by showing the
                                // user a dialog.
                                try {
                                    // Cast to a resolvable exception.
                                    ResolvableApiException resolvable = (ResolvableApiException) exception;
                                    // Show the dialog by calling startResolutionForResult(),
                                    // and check the result in onActivityResult().
                                    resolvable.startResolutionForResult(
                                            MainActivity.this,
                                            REQUEST_CHECK_SETTINGS);
                                } catch (IntentSender.SendIntentException e) {
                                    // Ignore the error.
                                } catch (ClassCastException e) {
                                    // Ignore, should be an impossible error.
                                }
                                break;
                            case LocationSettingsStatusCodes.SETTINGS_CHANGE_UNAVAILABLE:
                                Trace.i("Setting change not allowed");
                                // Location settings are not satisfied. However, we have no way to fix the
                                // settings so we won't show the dialog.

                                break;
                        }
                    }
                }
            });
    }


    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_CHECK_SETTINGS) {
            if (resultCode == Activity.RESULT_OK) {
                String result = data.getStringExtra("result");
            }
            if (resultCode == Activity.RESULT_CANCELED) {
                //Write your code if there's no result
            }
        }
    }

}
