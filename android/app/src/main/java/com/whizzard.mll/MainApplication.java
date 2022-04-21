package com.whizzard.mll;

import android.app.Application;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.rssignaturecapture.RSSignatureCapturePackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;
import com.rumax.reactnative.pdfviewer.PDFViewPackage;

import java.util.List;
import io.invertase.firebase.auth.RNFirebaseAuthPackage;

public class MainApplication extends Application implements ReactApplication {

  private static MainApplication mainApplication;
  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      @SuppressWarnings("UnnecessaryLocalVariable")
      List<ReactPackage> packages = new PackageList(this).getPackages();
      // Packages that cannot be autolinked yet can be added manually here, for example:
      // packages.add(new MyReactNativePackage());
      packages.add(new WhizzardLocationPackage());
      packages.add(new RNFirebaseAuthPackage());
      packages.add(new RSSignatureCapturePackage());
      return packages;
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    mainApplication = this;
  }

  public static synchronized MainApplication getInstance(){
    return mainApplication;
  }
}
