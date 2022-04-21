package com.whizzard.mll.util;

import java.io.BufferedWriter;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;

public class NetworkUtil {
//    public static final String BASE_IR_URL = "http://admin.whizzard.in";  //old live URL
//    public static final String BASE_IR_URL = "http://srinikandula.com";      //new Live URL HOLD

    //        public static final String BASE_IR_URL = "http://api.whizzard.in";      //Live URL HOLD,Server Break

    public static final String BASE_IR_URL = "http://testing.whizzard.in";            //Test URL
//        public static final String BASE_IR_URL = "http://mobileapi.whizzard.in";      //new Live URL working
    private static final String LOCATION_URI = "/api/noauth/saveDeviceGeoLocation";

    public static void secureRequest(String inputJson) {
        URL url;
        HttpURLConnection conn;
        //WebService.NetworkResult result = new WebService.NetworkResult();

        try {
            url = new URL(BASE_IR_URL + LOCATION_URI);
//            Trace.i("[url--> ]" + url);
//            Trace.i("input-->" + inputJson);
            conn = (HttpURLConnection) url.openConnection();
            conn.setReadTimeout(10000);
            conn.setConnectTimeout(15000);
            conn.setDoOutput(true);
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.addRequestProperty("Accept", "application/json");
//            Trace.i("Request Body --> " + inputJson);
            conn.setFixedLengthStreamingMode(inputJson.getBytes().length);
            conn.connect();


            if (inputJson != null) {
                OutputStream os = conn.getOutputStream();
                BufferedWriter writer = new BufferedWriter(
                        new OutputStreamWriter(os, "UTF-8"));
                writer.write(inputJson);

                writer.flush();
                writer.close();
                os.close();
            }

            Trace.d("Response Code: " + String.valueOf(conn.getResponseCode()));

            //build the string to store the response text from the server
            StringBuilder response = new StringBuilder();
            conn.disconnect();
            Trace.i("Response <--:" + response.toString());

        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }
}
