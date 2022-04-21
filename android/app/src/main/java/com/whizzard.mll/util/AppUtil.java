package com.whizzard.mll.util;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;

import com.whizzard.mll.MainActivity;


public class AppUtil {
    public static void dashboard(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        context.startActivity(intent);
        ((Activity) context).finish();
    }
}
