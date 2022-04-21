package com.whizzard.mll.service;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.Notification;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.location.Location;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.IBinder;
import android.os.Looper;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.facebook.react.bridge.Callback;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.Api;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.gson.Gson;
import com.reactnativecommunity.asyncstorage.AsyncLocalStorageUtil;
import com.reactnativecommunity.asyncstorage.ReactDatabaseSupplier;
import com.whizzard.mll.R;
import com.whizzard.mll.constants.AppConstants;
import com.whizzard.mll.constants.IntentConstants;
import com.whizzard.mll.permission.Permission;
import com.whizzard.mll.permission.PermissionCallback;
import com.whizzard.mll.permission.PermissionUtils;
import com.whizzard.mll.util.ApiRequest;
import com.whizzard.mll.util.NetworkUtil;
import com.whizzard.mll.util.Trace;

import org.json.JSONObject;

import static com.whizzard.mll.constants.IntentConstants.ACTION_LOCATION_BROADCAST;
import static com.whizzard.mll.constants.IntentConstants.EXTRA_LATITUDE;
import static com.whizzard.mll.constants.IntentConstants.EXTRA_LONGITUDE;

public class LocationTrackingService extends Service implements
        GoogleApiClient.ConnectionCallbacks, GoogleApiClient.OnConnectionFailedListener {

    private static final String ACTION_START = "com.h.location.service.start";
    private static final String ACTION_STOP = "com.h.location.service.stop";
    private static final int ONGOING_NOTIFICATION_ID = 1;
    private static Context context;
    private static boolean isRunning = false;
    Callback locationStatusCallback ;
    GoogleApiClient mLocationClient;
    LocationRequest mLocationRequest = new LocationRequest();
    LocationCallback locationCallback = new LocationCallback() {
        @Override
        public void onLocationResult(LocationResult locationResult) {
            for (Location location : locationResult.getLocations()) {
                // Update UI with location data
                Trace.d("Location changed");
                if (location != null) {
                    Trace.d("--> location: " + location.getLatitude() + "," + location.getLongitude());
                    sendLocation(location.getLatitude(), location.getLongitude());
                    //Send result to activities
                    sendMessageToUI(String.valueOf(location.getLatitude()), String.valueOf(location.getLongitude()));
                }
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
    }

    public static boolean isRunning() {
        return isRunning;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            if (ACTION_START.equals(intent.getAction())) {
                init();
            } else if (ACTION_STOP.equals(intent.getAction())) {
                LocationServices.getFusedLocationProviderClient(this).removeLocationUpdates(locationCallback);
                stopSelf();
                isRunning = false;
            }
        }

        //Make it stick to the notification panel so it is less prone to get cancelled by the Operating System.
        return START_STICKY;
    }



    @Override
    public void onDestroy() {
        super.onDestroy();
        isRunning = false;
    }

    private void init() {
        Trace.d("Entered into Init method");
        mLocationClient = new GoogleApiClient.Builder(this)
                .addConnectionCallbacks(this)
                .addOnConnectionFailedListener(this)
                .addApi(LocationServices.API)
                .build();

        mLocationRequest.setInterval(AppConstants.LOCATION_INTERVAL);
        mLocationRequest.setFastestInterval(AppConstants.FASTEST_LOCATION_INTERVAL);
        int priority = LocationRequest.PRIORITY_HIGH_ACCURACY; //by default
        //PRIORITY_BALANCED_POWER_ACCURACY, PRIORITY_LOW_POWER, PRIORITY_NO_POWER are the other priority modes
        mLocationRequest.setPriority(priority);
        mLocationClient.connect();
        setNotification();
    }

    private void setNotification() {
        Intent notificationIntent = new Intent(this, LocationTrackingService.class);
        notificationIntent.setAction(ACTION_STOP);
        PendingIntent pendingIntent = PendingIntent.getService(this, 1, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Action action = new Notification.Action.Builder(R.drawable.ic_launcher_foreground, "STOP UPDATES", pendingIntent).build();

        Notification notification;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            notification = new Notification.Builder(context, IntentConstants.NOTIFY_CHANNEL_ID)
                    .setContentTitle("Whizzard App:Have a great day, Tap for assistance.")
                    .setSmallIcon(R.drawable.ic_stat_onesignal_default)
                    .setContentIntent(pendingIntent)
                    .addAction(action)
                    .setOngoing(true)
                    .setShowWhen(false)
                    .setVisibility(Notification.VISIBILITY_SECRET)
                    .build();

        } else {
            notification = new Notification.Builder(this)
                    .setContentTitle("Whizzard App:Have a great day, Tap for assistance.")
                    .setSmallIcon(R.drawable.ic_stat_onesignal_default)
                    .setContentIntent(pendingIntent)
                    .addAction(action)
                    .setOngoing(true)
                    .setShowWhen(false)
                    .setVisibility(Notification.VISIBILITY_SECRET)
                    .build();
        }
        startForeground(ONGOING_NOTIFICATION_ID, notification);
    }


    @SuppressLint("StaticFieldLeak")
    private void sendLocation(double latitude, double longitude) {
        new AsyncTask<Void, Void, Void>() {
            @Override
            protected Void doInBackground(Void... voids) {
                Cursor catalystLocalStorage = null;
                SQLiteDatabase readableDatabase = null;
                String DEVICE_ID;
                String userId;
                String shiftId;
                try {
                    readableDatabase = ReactDatabaseSupplier.getInstance(context).getReadableDatabase();
                    if (readableDatabase != null) {
                        DEVICE_ID = AsyncLocalStorageUtil.getItemImpl(readableDatabase, "Whizzard:DEVICE_ID");
                        userId = AsyncLocalStorageUtil.getItemImpl(readableDatabase, "Whizzard:userId");
                        shiftId = AsyncLocalStorageUtil.getItemImpl(readableDatabase, "Whizzard:shiftId");
                        Trace.i("deviceId: " + DEVICE_ID+", User ID: "+userId+", shiftId:"+ shiftId);
                        if(DEVICE_ID != null && userId !=null) {
                            ApiRequest apiRequest = new ApiRequest();
                            apiRequest.setDeviceId(DEVICE_ID);
                            apiRequest.setUserId(userId);
                            apiRequest.setShiftId(shiftId);
                            apiRequest.setLatitude(latitude);
                            apiRequest.setLongitude(longitude);
                            Gson gson = new Gson();
                            String inputJson = gson.toJson(apiRequest, ApiRequest.class);
                            NetworkUtil.secureRequest(inputJson);
                        }
                    }
                } finally {
                    if (catalystLocalStorage != null) {
                        catalystLocalStorage.close();
                    }

                    if (readableDatabase != null) {
                        readableDatabase.close();
                    }
                }
                return null;
            }
        }.execute();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    /*
     * LOCATION CALLBACKS
     */
    @Override
    public void onConnected(Bundle dataBundle) {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Trace.i("== Error On onConnected() Permission not granted");
            //Permission not granted by user so cancel the further execution.
            return;
        }
        LocationServices.getFusedLocationProviderClient(this).requestLocationUpdates(mLocationRequest, locationCallback, Looper.myLooper());

        Trace.i("Connected to Google API");
    }

    /*
     * Called by Location Services if the connection to the
     * location client drops because of an error.
     */
    @Override
    public void onConnectionSuspended(int i) {
        Trace.d("Connection suspended");
    }

    public static void startService(Context activity) {
        context = activity;
        Trace.d("Connection suspended"+'>'+(!isRunning && activity != null));
        if (!isRunning && activity != null) {
            Intent intent = new Intent(activity, LocationTrackingService.class);
            intent.setAction(ACTION_START);
            activity.startService(intent);
            isRunning = true;
        }
    }

    public static void stopService(Context sContext) {
        if (isRunning) {
            if (sContext != null) {
                Intent intent = new Intent(sContext, LocationTrackingService.class);
                intent.setAction(ACTION_STOP);
                sContext.startService(intent);
            }
            isRunning = false;
        }
    }

    private void sendMessageToUI(String lat, String lng) {
        Trace.d("Sending info...");
        //Toast.makeText(this, "Location: " + lat + ", " + lng, Toast.LENGTH_SHORT).show();
        Intent intent = new Intent(ACTION_LOCATION_BROADCAST);
        intent.putExtra(EXTRA_LATITUDE, lat);
        intent.putExtra(EXTRA_LONGITUDE, lng);
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
    }


    @Override
    public void onConnectionFailed(ConnectionResult connectionResult) {
        Trace.d("Failed to connect to Google API");

    }

}
