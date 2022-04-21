import React from 'react';
import axios from 'axios';
import AsyncStorage from "@react-native-community/async-storage";
import {
    Alert,
    Image,
    ImageBackground,
    Linking, NativeModules,
    PermissionsAndroid,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import {Card, DefaultTheme, IconButton, Title} from "react-native-paper";
import _ from "lodash";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import FastImage from "react-native-fast-image";
import Ionicons from "react-native-vector-icons/dist/Ionicons";
import RNAndroidLocationEnabler from "react-native-android-location-enabler";
import {CText, LoadImages, LoadSVG, Styles} from "../common";
import Utils from "../common/Utils";
import Geolocation from "react-native-geolocation-service";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import Entypo from "react-native-vector-icons/dist/Entypo";
import Zocial from "react-native-vector-icons/dist/Zocial";
import FontAwesome5 from "react-native-vector-icons/dist/FontAwesome5";
import Fontisto from "react-native-vector-icons/dist/Fontisto";
import Config from "./Config";
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import ImageCropPicker from "react-native-image-crop-picker";
import Settings from "../Settings";
import HomeScreen from "../HomeScreen";
import DeviceInfo from 'react-native-device-info';

var LocationService = NativeModules.LocationService;

const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Bold'
    }
};

var Services = function () {
};

//LOCATIONS RETURN
Services.prototype.returnLocationForHeaders = async (returnLocation) => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            Geolocation.getCurrentPosition(
                async (position) => {
                    const currentLocation = position.coords;
                    // console.log('Services location', position);
                    returnLocation(currentLocation)
                },
                (error) => {
                    // console.log('SERVICES HEADERS Location error', error);
                    Utils.dialogBox(error.message, '');
                    returnLocation(null)
                }
            );
        } else {
            // Utils.dialogBox('Location permission denied', '');
            returnLocation(null)
            Services.prototype.deniedLocationAlert()
        }
    } catch (err) {
        Utils.dialogBox(err, '')
        returnLocation(null)
    }
};

//HTTP request for Auth API's
Services.prototype.AuthHTTPRequest = function (URL, method, body, successCallback, errorCallback) {
    // let locationsData = {latitude : null,longitude:null}
    AsyncStorage.getItem('Whizzard:token').then((token) => {
        AsyncStorage.getItem('Whizzard:DEVICE_ID').then((DEVICE_ID) => {
            // console.log('From Services', URL, method, body,data)
            // console.log('AndroidId at AuthHttp',DeviceInfo.getDeviceId())
            // console.log('token',token)
            const start = new Date().getTime();
            Services.prototype.returnLocationForHeaders((returnLocation)=>{
                let latitude = null;
                let longitude=null;
                if (returnLocation){
                    latitude = returnLocation.latitude;
                    longitude = returnLocation.longitude
                }
            // console.log('AUTH locations ',locations);
               axios(URL, {
                   method: method,
                   headers: {
                       Accept: "application/json",
                       "Content-Type": "application/json",
                       "Authorization": token,
                       "DEVICEID": DEVICE_ID,
                       "AndroidId":DeviceInfo.getDeviceId(),
                       'latitude':latitude,
                       'longitude':longitude
                       // 'latitude':25.441030,
                       // 'longitude':85.3987686
                   },
                   data: body
               }).then(function (response) {
                   if (response) {
                       successCallback(response);
                       // console.log('AUTH success response',response);
                       const end = new Date().getTime();
                       const timeTaken= Math.abs(end-start);
                       const finalTime = timeTaken/1000;
                       // Utils.dialogBox(URL+'Timetaken==>'+finalTime,'')
                       // if (finalTime > 1){
                       //     Alert.alert('Timetaken==>'+finalTime,URL)
                       // }
                       // console.log(URL,'    ==>//',finalTime);

                   }
               }).catch(function (error) {
                   // console.log('services error',error.response,error.message)
                   errorCallback(error);
               })
            });
        });
    });
};

Services.prototype.returnMStoSec = function (millis) {
    // var minutes = Math.floor(millis / 60000);
    var minutes = millis / 60000
    var seconds = ((millis % 60000) / 1000);
    return minutes + ":"+ seconds
    // // var seconds = ((millis % 60000) / 1000);
    // return ((millis % 60000) / 1000)
};

//HTTP request for No Auth API's
Services.prototype.NoAuthHTTPRequest = function (URL, method, body, successCallback, errorCallback) {
    AsyncStorage.getItem('Whizzard:DEVICE_ID').then((DEVICE_ID) => {
        // console.log('Login DEVICE_ID',DEVICE_ID);
        // console.log('AndroidId at NoAuthHttp',DeviceInfo.getDeviceId())
        const start = new Date().getTime();
        Services.prototype.returnLocationForHeaders((returnLocation)=>{
            let latitude = null;
            let longitude=null;
            if (returnLocation){
                latitude = returnLocation.latitude;
                longitude = returnLocation.longitude
            }
        axios(URL, {
            method: method,
            // timeout: 1000*10,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "AndroidId":DeviceInfo.getDeviceId(),
                'latitude':latitude,
                'longitude':longitude,
                "DEVICEID": DEVICE_ID
                // "DEVICEID": null
            },
            data: body,
        }).then(function (response) {
            // console.log('NoAuthHTTPRequest response', response)
            if (response) {
                successCallback(response);
                const end = new Date().getTime();
                const timeTaken= Math.abs(end-start);
                const finalTime = timeTaken/1000;
                // Utils.dialogBox(URL+'Timetaken==>'+finalTime,'')
                // if (finalTime > 1){
                //     Alert.alert('Timetaken==>'+finalTime,URL)
                // }
                // console.log(URL,'    ==>//',finalTime);
            }
        }).catch(function (error) {
            // console.log('NoAuthHTTPRequest error', error, error.response)
            errorCallback(error)
        })
    });
    });
};

//HTTP request for Auth API's
Services.prototype.AuthProfileHTTPRequest = function (URL, method, body, successCallback, errorCallback) {
    AsyncStorage.getItem('Whizzard:token').then((token) => {
        AsyncStorage.getItem('Whizzard:DEVICE_ID').then((DEVICE_ID) => {
            // console.log('From Services', URL, method, body,data)
            const start = new Date().getTime();
            Services.prototype.returnLocationForHeaders((returnLocation)=>{
                let latitude = null;
                let longitude=null;
                if (returnLocation){
                    latitude = returnLocation.latitude;
                    longitude = returnLocation.longitude
                }
            axios(URL, {
                method: method,
                headers: {
                    Accept: "application/json",
                    'Content-Type': 'multipart/form-data;',
                    "Authorization": token,
                    "DEVICEID": DEVICE_ID,
                    "AndroidId":DeviceInfo.getDeviceId(),
                    'latitude':latitude,
                    'longitude':longitude,
                },
                data: body
            }).then(function (response) {
                if (response) {
                    successCallback(response);
                    const end = new Date().getTime();
                    const timeTaken= Math.abs(end-start);
                    const finalTime = timeTaken/1000;
                    // Utils.dialogBox(URL+'Timetaken==>'+finalTime,'')
                    // if (finalTime > 1){
                    //     Alert.alert('Timetaken==>'+finalTime,URL)
                    // }
                    // console.log(URL,'    ==>//',finalTime);
                }
            }).catch(function (error) {
                // console.log('services error',error.response,error.message)
                errorCallback(error);
            })
        });
    });
    });
};

//HTTP request for Auth API's
Services.prototype.AuthDeleteImageHTTPRequest = function (URL, method, body, successCallback, errorCallback) {
    AsyncStorage.getItem('Whizzard:token').then((token) => {
        AsyncStorage.getItem('Whizzard:DEVICE_ID').then((DEVICE_ID) => {
            // console.log('From Services', URL, method, body,data)
            // const start = new Date().getTime();
            Services.prototype.returnLocationForHeaders((returnLocation)=>{
                let latitude = null;
                let longitude=null;
                if (returnLocation){
                    latitude = returnLocation.latitude;
                    longitude = returnLocation.longitude
                }
            axios(URL, {
                method: method,
                headers: {
                    Accept: "application/json",
                    // 'Content-Type': 'multipart/form-data;',
                    "Authorization": token,
                    "DEVICEID": DEVICE_ID,
                    "AndroidId":DeviceInfo.getDeviceId(),
                    'latitude':latitude,
                    'longitude':longitude
                },
                data: body
            }).then(function (response) {
                if (response) {
                    successCallback(response);
                    // const end = new Date().getTime();
                    // const timeTaken= Math.abs(end-start);
                    const finalTime = timeTaken/1000;
                    // Utils.dialogBox(URL+'Timetaken==>'+finalTime,'')
                    // if (finalTime > 1){
                    //     Alert.alert('Timetaken==>'+finalTime,URL)
                    // }
                    // console.log(URL,'    ==>//',finalTime);
                }
            }).catch(function (error) {
                // console.log('services error',error.response,error.message)
                errorCallback(error);
            })
        });
    });
    });
};

//HTTP request for Auth Signature API's
Services.prototype.AuthSignatureHTTPRequest = function (URL, method, body, successCallback, errorCallback) {
    AsyncStorage.getItem('Whizzard:token').then((token) => {
        AsyncStorage.getItem('Whizzard:DEVICE_ID').then((DEVICE_ID) => {
            // console.log('From Services', URL, method, body,data)
            // const start = new Date().getTime();
            Services.prototype.returnLocationForHeaders((returnLocation)=>{
                let latitude = null;
                let longitude=null;
                if (returnLocation){
                    latitude = returnLocation.latitude;
                    longitude = returnLocation.longitude
                }
            axios(URL, {
                method: method,
                headers: {
                    Accept: "application/json",
                    // 'Content-Type': 'multipart/form-data;',
                    "Authorization": token,
                    "DEVICEID": DEVICE_ID,
                    "AndroidId":DeviceInfo.getDeviceId(),
                    'latitude':latitude,
                    'longitude':longitude
                },
                data: body
            }).then(function (response) {
                if (response) {
                    successCallback(response);
                    // const end = new Date().getTime();
                    // const timeTaken= Math.abs(end-start);
                    // console.log(URL,'Signature timeTaken==>',timeTaken/1000);
                }
            }).catch(function (error) {
                // console.log('services error',error.response,error.message)
                errorCallback(error);
            })
        });
    });
    });
};

//to check camera access permission
Services.prototype.requestCameraPermission = async () => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA
        );
        // If CAMERA Permission is granted
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
        Utils.dialogBox('Camera Permissions Denied','');
        return false;
    }
};

//to check library access permissions
Services.prototype.requestExternalWritePermission = async () => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        // If WRITE_EXTERNAL_STORAGE Permission is granted
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
        Utils.dialogBox('External Permissions Denied','');
        return false;
    }
};

//checks permissions and on uploadType will direct to function
Services.prototype.checkImageUploadPermissions = async (uploadType,successCallback) => {
    // uploadType === LIBRARY //CAMERA
    let isCameraPermitted = await Services.prototype.requestCameraPermission();
    let isStoragePermitted = await Services.prototype.requestExternalWritePermission();
    if (isCameraPermitted && isStoragePermitted) {
        if (uploadType === 'LIBRARY'){ //CAMERA
            Services.prototype.chooseFileFromLibrary(uploadType,successCallback)
        }else {
            Services.prototype.captureImage(uploadType,successCallback)
        }
    }else {
        Utils.dialogBox(isCameraPermitted ? 'External Permissions Denied' : 'Camera Permissions Denied','');
    }
};

//to upload from library with crop
Services.prototype.chooseFileFromLibrary = function (uploadType,successCallback) {
    const options = {
        title: 'Select Avatar',
        storageOptions: {
            skipBackup: true,
            path: 'images',
        },
        maxWidth: 1200, maxHeight: 800,
        saveToPhotos: true
    };

    launchImageLibrary(options, (response)=> {
            // console.log('Services pic resposne', response)
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            } else if (response.fileSize > 2000000) {
                console.log('pic resposne 2000000', response.fileSize);
                Utils.dialogBox('Image Size should be less than 2 MB', '');
            } else {
                ImageCropPicker.openCropper({
                    freeStyleCropEnabled: true,
                    // path: response.uri,
                    path: response.assets[0].uri,
                }).then(image => {
                    // console.log('Services crop image respose', image);
                    // let fileName = response.uri.split('/').pop();
                    let tempImageData = {}
                    let formData = new FormData();
                    formData.append('files', {
                                    uri: image.path,
                                    type: image.mime,
                                    name: image.path
                                });
                    tempImageData.image = image;
                    tempImageData.formData = formData;
                    successCallback(tempImageData);
                }).catch(error => {
                    console.log('Services crop image error', error);
                });
            }
        },(error)=>{
        console.log('device image error',error);
        })
};

//to upload by camera with crop
Services.prototype.captureImage = function (uploadType,successCallback) {
    const options = {
        title: 'Select Avatar',
        storageOptions: {
            skipBackup: true,
            path: 'images',
        },
        maxWidth: 1200, maxHeight: 800,
        saveToPhotos: true
    };

    launchCamera(options, (response)=> {
        // console.log('Services pic resposne', response)
        if (response.didCancel) {
            console.log('User cancelled image picker');
        } else if (response.error) {
            console.log('ImagePicker Error: ', response.error);
        } else if (response.customButton) {
            console.log('User tapped custom button: ', response.customButton);
        } else if (response.fileSize > 2000000) {
            console.log('pic resposne 2000000', response.fileSize);
            Utils.dialogBox('Image Size should be less than 2 MB', '');
        } else {
            ImageCropPicker.openCropper({
                freeStyleCropEnabled: true,
                // path: response.uri,
                path: response.assets[0].uri,
            }).then(image => {
                // console.log('Services crop image respose', image);
                // let fileName = response.uri.split('/').pop();
                let tempImageData = {}
                let formData = new FormData();
                formData.append('files', {
                    uri: image.path,
                    type: image.mime,
                    name: image.path
                });
                tempImageData.image = image;
                tempImageData.formData = formData;
                successCallback(tempImageData);
            }).catch(error => {
                console.log('Services crop image error', error);
            });
        }
    },(error)=>{
        console.log('device image error',error);
    })
};

Services.prototype.stopLocation = async () => {
    // console.log('stopLocation fun enter====MockLocationCheck');
    await LocationService.stopLocation((err) => {
        // console.log('inside stopLocation', err)
    }, (msg) => {
        // console.log('outside stopLocation offline', msg)
        // Utils.setToken('locationStatus', JSON.stringify(msg), function () {
        // });
    });
};

Services.prototype.MockLocationAlertMessage = () => {
    // return'Whizzard found this Device using Mock Location,Your Account Will be Locked'
    return'Your Account Will be Locked for Using Mock Location'
};

Services.prototype.returnMockAlertTitle = function () {
    return (
        "Mock Location Alert"
    )
};

Services.prototype.showMockLocationAlert = function (alertMessage) {
    return(
        // Alert.alert(Services.prototype.returnMockAlertTitle(), Services.prototype.MockLocationAlertMessage())
        Alert.alert(Services.prototype.returnMockAlertTitle(),alertMessage)
    )
};

Services.prototype.deniedLocationAlert = function () {
    return(
        Alert.alert("Location Permissions Denied",
            'Allow Whizzard to access locations all the time. Please change the permissions in App Settings.',[
            // {
            //     text: 'Ask Again', onPress: () => {
            //         this.requestLocationPermission()
            //     }
            // },
            {
                text: 'Open Settings', onPress: () => {
                    Linking.openSettings()
                }
            }
        ])
    )
};

//checks MOCK Location Permissions
Services.prototype.checkMockLocationPermission = async (successCallback) => {
    AsyncStorage.getItem('Whizzard:requireMockLocationCheck').then(async (response) => {
        let requireMockLocationCheck = JSON.parse(response)
        // console.log('services requireMockLocationCheck===>',requireMockLocationCheck,typeof(response),typeof(requireMockLocationCheck));
        if (requireMockLocationCheck) {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                );
                // console.log('Services PERM start');
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    // console.log('Services PERM start 2');
                    Geolocation.getCurrentPosition(
                        async (position) => {
                            // console.log('Services PERM start 3');
                            const currentLocation = position.coords;
                            // console.log('Services location', position);
                            if (position.mocked){
                            // if (true) {
                                const self = this;
                                AsyncStorage.getItem('Whizzard:userId').then((userId) => {
                                    const logoutURL = Config.routes.BASE_URL + Config.routes.LOCK_USER;
                                    const body = {
                                        userId: userId,
                                        location: {
                                            latitude: currentLocation.latitude,
                                            longitude: currentLocation.longitude
                                        }
                                    };
                                    {
                                        Services.prototype.AuthHTTPRequest(logoutURL, 'POST', body, async function (response) {
                                            // await AsyncStorage.removeItem("Whizzard:token");
                                            // await AsyncStorage.clear();
                                            if (response.status === 200) {
                                                let responseData = response.data;
                                                // console.log("lock user resp 200", response);
                                                if (responseData.locked) {
                                                    await AsyncStorage.clear();
                                                }
                                                if (responseData.locked) {
                                                    Services.prototype.stopLocation()
                                                }
                                                if (responseData.showAlert) {
                                                    Services.prototype.showMockLocationAlert(responseData.message)
                                                }
                                                successCallback(responseData.locked);
                                                // successCallback(false);
                                            }
                                        }, function (error) {
                                            successCallback(false);
                                            // console.log('logoutURL error', error, error.response);
                                        })
                                    }
                                });
                            } else {
                                // console.log('MOCK check end but 2');
                                // Utils.dialogBox('Location is Good','')
                                successCallback(false);
                            }
                        },
                        (error) => {
                            // console.log('SERVICES mock error', error);
                            Utils.dialogBox(error.message, '');
                            successCallback(false)
                        },
                        // {
                        //     enableHighAccuracy: true,
                        //     timeout: 10000, maximumAge:100
                        // }
                    );
                } else {
                    // console.log('location perm Denied');
                    Utils.dialogBox('Location permission denied', '');
                    {
                        Services.prototype.stopLocation()
                    }
                    successCallback(true)
                }
            } catch (err) {
                // console.log('MOCK check end but 1');
                // Utils.dialogBox(err, '')
                // console.log('location perm err',err);
                // console.log('location perm Error');
                Utils.dialogBox('Location permission denied', '');
                {
                    Services.prototype.stopLocation()
                }
                successCallback(true)
            }
        } else {
            // console.log('MOCK check end');
            successCallback(false)
        }
    }).catch(() => {
        // console.log('MOCK Local storage CATCH');
        successCallback(false)
    })
};

Services.prototype.checkMockLocation = async () => {
    console.log('Mock location check at Services start')

};

//checks MOCK Location Permissions
Services.prototype.returnCurrentPosition = async (successCallback) => {
                    Geolocation.getCurrentPosition(
                        async (position) => {
                            // const currentLocation = position.coords;
                            successCallback(position.coords);
    })
};

Services.prototype.directToLockUser = async (currentLocation) => {
    const self = this;
    AsyncStorage.getItem('Whizzard:userId').then((userId) => {
        const logoutURL = Config.routes.BASE_URL + Config.routes.LOCK_USER;
        const body = {
            userId: userId,
            location:{latitude:currentLocation.latitude, longitude:currentLocation.longitude}
        };
        {
            Services.prototype.AuthHTTPRequest(logoutURL, 'POST', body, async function (response) {
                await AsyncStorage.removeItem("Whizzard:token");
                if (response.status === 200) {
                    // Services.prototype.directToLogin()
                    // Settings.prototype.removeToken()
                    // await AsyncStorage.removeItem("Whizzard:token");
                    // Services.prototype.directToLogout()
                    // HomeScreen.prototype.TokenVerification()
                    // this.props.navigation.navigate('authNavigator')
                    Alert.alert('Whizzard found this Device using Mock Location,Your Account Will be Locked', alert)
                }
            }, function (error) {
                self.props.navigation.navigate('Login');
            })
        }
    });
};

Services.prototype.directToLogout = async () => {
    const self = this;
    AsyncStorage.getItem('Whizzard:userId').then((userId) => {
        const logoutURL = Config.routes.BASE_URL + Config.routes.LOGOUT_MOBILE;
        const body = {userId: userId};
        {
            Services.prototype.AuthHTTPRequest(logoutURL, 'PUT', body, async function (response) {
                if (response.status === 200) {
                    console.log("logoutURL resp 200", response);
                    // Services.prototype.directToLogin()
                    // Settings.prototype.removeToken()
                    // await AsyncStorage.removeItem("Whizzard:token");
                    // Services.prototype.directToLogout()
                }
            }, function (error) {
                console.log('logoutURL error', error, error.response);
                if (error.response) {
                    if (error.response.status === 403) {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox("Token Expired,Please Login Again", '');
                        self.props.navigation.navigate('Login');
                    } else if (error.response.status === 500) {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox(error.response.data.message, '');
                    } else if (error.response.status === 400) {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox(error.response.data.message, '');
                    } else {
                        self.setState({spinnerBool: false});
                        Utils.dialogBox("Error loading Log History, Please contact Administrator ", '');
                    }
                } else {
                    self.setState({spinnerBool: false});
                    Utils.dialogBox(error.message, '');
                }
            })
        }
    });
};

Services.prototype.directToLogin = async () => {
    return(
        this.props.navigation.navigate('Login')
    )
}

Services.prototype.checkIFSCfromList = (ifscCode,successCallback) => {
     const self = this;
    const apiUrl = Config.routes.BASE_URL + Config.routes.VERIFY_IFSC_CODE + '?ifscCode=' + _.toUpper(ifscCode);
     const body = {};
         Services.prototype.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
            if (response.status === 200) {
                // console.log("ifsc check resp 200 services", response);
                successCallback(response.data)
            }else {
                successCallback(false)
            }
        })
 };


Services.prototype.getUserRoles = function (role) {
    if (role === 1) {
        return "Associate"
    } else if (role === 5) {
        return "Driver"
    } else if (role === 10) {
        return "Driver & Associate"
    } else if (role === 15) {
        return "Labourer"
    } else if (role === 19) {
        return "Process Associate"
    } else if (role === 20) {
        return 'Supervisor'
    } else if (role === 25) {
        return 'Shift Lead'
    } else if (role === 26) {
        return 'Hub Manager'
    } else if (role === 27) {
        return 'Finance'
    } else if (role === 28) {
        return 'Technology'
    } else if (role === 29) {
        return 'Central'
    } else if (role === 30) {
        return 'Cluster Manager'
    } else if (role === 31) {
        return 'Ops Manager'
    } else if (role === 35) {
        return 'City Manager'
    } else if (role === 40) {
        return 'Regional Manager'
    } else if (role === 45) {
        return 'Super User'
    } else if (role === 65) {
        return 'Employee'
    } else return null
};

Services.prototype.getUserRolesShortName = function (role) {
    if (role === 1) {
        return "A"
    } else if (role === 5) {
        return "D"
    } else if (role === 10) {
        return "DDA"
    } else if (role === 15) {
        return "L"
    } else if (role === 19) {
        return "PA"
    } else if (role === 20) {
        return 'S'
    } else if (role === 25) {
        return 'SL'
    } else if (role === 26) {
        return 'HM'
    } else if (role === 27) {
        return 'F'
    } else if (role === 28) {
        return 'T'
    } else if (role === 29) {
        return 'C'
    } else if (role === 30) {
        return 'CLM'
    } else if (role === 31) {
        return 'OM'
    } else if (role === 35) {
        return 'CityM'
    } else if (role === 40) {
        return 'RM'
    } else if (role === 45) {
        return 'SU'
    } else if (role === 65) {
        return 'E'
    } else return null
};

Services.prototype.returnRoleName = function (roleName) {
    if (roleName === 'ASSOCIATE') {
        return 'Associate'
    } else if (roleName === 'DRIVER') {
        return 'Driver';
    } else if (roleName === 'DRIVER_AND_ASSOCIATE') {
        return 'Driver & Associate';
    } else if (roleName === 'LABOURER') {
        return 'Labourer';
    } else if (roleName === 'PROCESS_ASSOCIATE') {
        return 'Process Associate';
    } else if (roleName === 'SITE_SUPERVISOR') {
        return 'Site Supervisor';
    } else if (roleName === 'SHIFT_LEAD') {
        return 'Shift Lead';
    } else if (roleName === 'HUB_MANAGER') {
        return 'Hub Manager';
    } else if (roleName === 'FINANCE') {
        return 'Finance';
    } else if (roleName === 'TECHNOLOGY') {
        return 'Technology';
    } else if (roleName === 'CENTRAL') {
        return 'Central';
    } else if (roleName === 'CLUSTER_MANAGER') {
        return 'Cluster Manager';
    } else if (roleName === 'OPS_MANAGER') {
        return 'Ops Manager';
    } else if (roleName === 'CITY_MANAGER') {
        return 'City Manager';
    } else if (roleName === 'REGIONAL_MANAGER') {
        return 'Regional Manager';
    } else if (roleName === 'SUPER_USER') {
        return 'Super User';
    } else if (roleName === 'EMPLOYEE') {
        return 'Employee';
    } else {
        return roleName
    }
};

Services.prototype.returnShiftStatusText = function (shiftStatus) {
    if (shiftStatus === 'INIT') {
        return 'Init'
    } else if (shiftStatus === 'ATTENDANCE_MARKED') {
        return 'Attendance Marked';
    } else if (shiftStatus === 'SHIFT_IN_PROGRESS') {
        return 'Shift in Progress';
    } else if (shiftStatus === 'SHIFT_ENDED') {
        return 'Shift Ended';
    } else if (shiftStatus === 'SHIFT_AUTOCLOSED') {
        return 'Shift Autoclosed';
    } else if (shiftStatus === 'SHIFT_SUSPENDED') {
        return 'Shift Suspended';
    } else if (shiftStatus === 'SHIFT_CLOSED_BY_SUPERVISOR') {
        return 'Shift Closed by Supervisor';
    } else if (shiftStatus === 'SHIFT_CANCELLED_BY_SUPERVISOR') {
        return 'Shift Cancelled by Supervisor';
    } else if (shiftStatus === 'REPORTED_ABSENT') {
        return 'Reported Absent';
    } else {
        return shiftStatus
    }
};

Services.prototype.returnVehicleType = function (type) {
    // console.log('vehicle type services',type);
         if(type === 2){
          return (
             LoadSVG.trips_two_wheeler
          )
        }else if (type === 3){
            return (
                // <Image
                //     style={[ {height: 32, width: 46},Styles.bgLBlueAsh]}
                //     source={type === 2 ? LoadImages.vehicle_two : type === 3 ? LoadImages.vehicle_three : type === 4 ? LoadImages.vehicle_four : null}
                // />
                LoadSVG.trips_three_wheeler
            )
         }else if (type === 4){
             return (
                 // LoadSVG.vehicle_four_icon //as per design
                 LoadSVG.trips_four_wheeler
             )
         }else {
             null
         }
};

Services.prototype.returnMinusSVG = function () {
    return (
        <View>
            {LoadSVG.minusIcon}
            <View style={[Styles.posAbsolute,{top:7,left:5}]}>
                {LoadSVG.inside_MinusIcon}
            </View>
        </View>
    )
};

Services.prototype.returnCardStatusIcon = function (status) {
    {/*clientUserIdDetailsUpdated,tripSheetIdDetailsUpdated,kilometerDetailsUpdated,packageDetailsUpdated*/}
    if (status === true){
        return (
            LoadSVG.completedIcon
        )
    }else {
        return (
            <View>
                {LoadSVG.minusIcon}
                <View style={[Styles.posAbsolute,{top:7,left:5}]}>
                    {LoadSVG.inside_MinusIcon}
                </View>
            </View>
        )
    }
};

Services.prototype.returnCardStatusIconAtEdit = function (status) {
    {/*clientUserIdDetailsUpdated,tripSheetIdDetailsUpdated,kilometerDetailsUpdated,packageDetailsUpdated*/}
    if (status === true){
        return (
            LoadSVG.completedIcon
        )
    }else {
        return (
            <View>
                {LoadSVG.minusIcon_resized}
                <View style={[Styles.posAbsolute,{top:7,left:5}]}>
                    {LoadSVG.inside_MinusIcon_resized}
                </View>
            </View>
        )
    }
};

Services.prototype.convertBackendDateFormat = function (date) {
    return (
        (new Date(date).getFullYear()) + '-' + (new Date(date).getMonth() + 1) + '-' + (new Date(date).getDay())
    )
};

//NOT WORKING USED IN END ORDERS
Services.prototype.setDateHM = function (timeStamp) {
    return (
        <CText cStyle={[Styles.f14, Styles.ffMbold]}>
            {((new Date(timeStamp).getDay() <= 9 ? "0" + new Date(timeStamp).getDay() : new Date(timeStamp).getDay())
                + '-' +
                ((new Date(timeStamp).getMonth() + 1) <= 9 ? "0" + (new Date(timeStamp).getMonth() + 1) : new Date(timeStamp).getMonth() + 1)
                + '-' +
                (new Date(timeStamp).getFullYear()))}
            {'  '}
            {(new Date(timeStamp).getHours() <= 9 ? "0" + new Date(timeStamp).getHours() : new Date(timeStamp).getHours()) + ':' +
            (new Date(timeStamp).getMinutes() <= 9 ? "0" + new Date(timeStamp).getMinutes() : new Date(timeStamp).getMinutes())}
        </CText>
    )
};

//For Shift In Progress
Services.prototype.shiftDuration = function (item) {
    const timeStart = new Date(item.actualStartTime).getTime()
    let timeEnd = new Date().getTime();
    let hourDiff = timeEnd - timeStart; //in ms
    let secDiff = hourDiff / 1000; //in s
    let minDiff = hourDiff / 60 / 1000; //in minutes
    let hDiff = hourDiff / 3600 / 1000; //in hours
    let humanReadable = {};
    humanReadable.hours = Math.floor(hDiff);
    humanReadable.minutes = Math.floor(minDiff - 60 * humanReadable.hours);
    // console.log(humanReadable); //{hours: 0, minutes: 30}
    // this.setState({ ShiftDuration: humanReadable })
    return (
        <Text
            style={[Styles.ffMbold, Styles.f16]}> ({humanReadable.hours === 0 && humanReadable.minutes === 0 ? '0 m' : humanReadable.hours === 0 ? null : humanReadable.hours + 'h '}{humanReadable.minutes === 0 ? null : humanReadable.minutes + 'm'} ago)</Text>
    )
}

//For Shift In Progress
Services.prototype.shiftDurationHHMM = function (item) {
    const timeStart = new Date(item.actualStartTime).getTime()
    let timeEnd = new Date().getTime();
    let hourDiff = timeEnd - timeStart; //in ms
    let secDiff = hourDiff / 1000; //in s
    let minDiff = hourDiff / 60 / 1000; //in minutes
    let hDiff = hourDiff / 3600 / 1000; //in hours
    let humanReadable = {};
    humanReadable.hours = Math.floor(hDiff);
    humanReadable.minutes = Math.floor(minDiff - 60 * humanReadable.hours);
    // console.log(humanReadable); //{hours: 0, minutes: 30}
    // this.setState({ ShiftDuration: humanReadable })
    return (
        <Text
            style={[Styles.ffMbold, Styles.f16]}>{humanReadable.hours === 0 && humanReadable.minutes === 0 ? '0 m' : humanReadable.hours === 0 ? null : humanReadable.hours + 'h '}{humanReadable.minutes === 0 ? null : humanReadable.minutes + 'm'}</Text>
    )
}

//For Shift End 2 hours check
Services.prototype.returnCalculatedShiftDuration = function (timeStamp) {
    const timeStart = new Date(timeStamp).getTime()
    let timeEnd = new Date().getTime();
    let hourDiff = timeEnd - timeStart; //in ms
    let secDiff = hourDiff / 1000; //in s
    let minDiff = hourDiff / 60 / 1000; //in minutes
    let hDiff = hourDiff / 3600 / 1000; //in hours
    // console.log(minDiff);
    return (
        minDiff
    )
}

//to convert into HH MM and 0checks
Services.prototype.returnCalculatedHoursMinutes = function (timeStamp) {
    const timeHH = new Date(timeStamp).getHours()
    const timeMM = new Date(timeStamp).getMinutes()
    return (
        (timeHH <= 9 ? "0" + timeHH : timeHH + ':' +
        (timeMM <= 9 ? "0" + timeMM : timeMM)
    )
    )
}

//to convert into HH and 0checks
Services.prototype.returnCalculatedHours = function (timeStamp) {
    const timeHH = new Date(timeStamp).getHours()
     return (
        (timeHH <= 9 ? "0" + timeHH : timeHH )
    )
}

//to convert into MM and 0checks
Services.prototype.returnCalculatedMinutes = function (timeStamp) {
     const timeMM = new Date(timeStamp).getMinutes()
    return (
        (timeMM <= 9 ? "0" + timeMM : timeMM)
    )
}

Services.prototype.returnCalendarFormat = function (timestamp) {
    // var timestamp = 1537345115000;
    // var timestamp = time;
    var date_not_formatted = new Date(timestamp);

    var formatted_string = date_not_formatted.getFullYear() + "-";

    if (date_not_formatted.getMonth() < 9) {
        formatted_string += "0";
    }
    formatted_string += (date_not_formatted.getMonth() + 1);
    formatted_string += "-";

    if (date_not_formatted.getDate() < 10) {
        formatted_string += "0";
    }
    formatted_string += date_not_formatted.getDate();

    // console.log('formatted_string',formatted_string);
    return (formatted_string)
};

Services.prototype.returnCalendarMonthYear = function (date) {
    // console.log('date in services',date)
    let monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    // let month = new Date(date).toLocaleString('default', { month: 'long' })
    let month = monthNames[new Date(date).getMonth()]
    let year = new Date(date).getFullYear()
    // console.log('date in services',month,year);
    return (month + ' ' + year)
};

Services.prototype.returnCalendarMonthYearNumber = function (date) {
    const month = new Date(date).getMonth()+1;
    const year = new Date(date).getFullYear();
    // console.log('date in number format',month,year);
    return (month + '-' + year)
};

Services.prototype.returnDateMonthYearFormat = function (date) {
    // console.log('date in services',date)
    let monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    // let month = new Date(date).toLocaleString('default', { month: 'long' })
    let month = monthNames[new Date(date).getMonth()]
    let year = new Date(date).getFullYear()
    let day = new Date(date).getDate()
    // console.log('date in services',month,year);
    return (day + ' ' + month + ' ' + year)
};

Services.prototype.returnDateMonthYearFormatinShort = function (date) {
    // console.log('date in services',date)
    let monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    // let month = new Date(date).toLocaleString('default', { month: 'long' })
    let month = monthNames[new Date(date).getMonth()]
    let year = new Date(date).getFullYear()
    let day = new Date(date).getDate()
    // console.log('date in services',month,year);

    if (day < 10) {
        day = "0"+day;
    }

    return (day + ' ' + month + ' `' + year.toString().substr(-2))
};

Services.prototype.returnDateMonthYearFormatinMonthShort = function (date) {
    // console.log('date in services',date)
    let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    // let month = new Date(date).toLocaleString('default', { month: 'long' })
    let month = monthNames[new Date(date).getMonth()]
    let year = new Date(date).getFullYear()
    let day = new Date(date).getDate()
    // console.log('date in services',month,year);

    if (day < 10) {
        day = "0"+day;
    }

    return (day + ' ' + month + ' `' + year.toString().substr(-2))
};

Services.prototype.returnYesterdayDate = function () {
    // console.log('date in services',date)
    var date = new Date();
    date.setDate(date.getDate() - 1);
    // console.log('services date',date);
    // Services.prototype.returnCalendarFormat(date)
    // return date.getDate() + '-' + (date.getMonth()+1) + '-' + date.getFullYear();
    return Services.prototype.returnCalendarFormat(date);
};

Services.prototype.returnDifferentDates = function (dayStatus) {

    var date = new Date();
    if (dayStatus === -1){
        date.setDate(date.getDate() - 1);
    }else if (dayStatus === 1){
        date.setDate(date.getDate() + 1);
    }else {
        date.setDate(date.getDate());
    }
    // console.log('date in services',date,'final',Services.prototype.returnCalendarFormat(date))
    return Services.prototype.returnCalendarFormat(date);
};

// User Profile Pic
Services.prototype.getUserProfilePic = function (image) {
    return (
        image === '' || image === null || !image ?
            <View style={[Styles.aslCenter, {marginRight: 15}]}>{LoadSVG.profilePlaceholder}</View>
            :
            <View>
                <ImageBackground style={[Styles.img55, Styles.aslCenter, Styles.br50, {marginRight: 15}]}
                                 source={LoadImages.Thumbnail}>
                    <Image
                        style={[Styles.img55, Styles.aslCenter, Styles.br50]}
                        source={{
                            uri: image,
                        }}
                    />
                </ImageBackground>
            </View>
    )
};

Services.prototype.returnUserProfileCard = function (data,phoneNumber){
    return(
        <Card
            style={[
                Styles.OrdersScreenCardshadow,Styles.bgWhite,Styles.marV10,Styles.br0,Styles.p5]}>
            <Card.Title
                left={() =>
                    <View>
                        {Services.prototype.getUserProfilePic(data.profilePicUrl)}
                    </View>}
                title={<Text style={[Styles.f18,Styles.ffLBold]}>{_.startCase(_.toLower(data.name))}</Text>}
                titleStyle={[Styles.ffLBold, Styles.f18,Styles.colorBlue]}
                subtitleStyle={[Styles.ffLRegular]}
                subtitle={
                    <Text style={[Styles.f14,Styles.ffLBold,Styles.colorBlue]}>{data.status}{phoneNumber ? '('+phoneNumber +')': null }</Text>
                }
            >
            </Card.Title>
        </Card>
    )
}

Services.prototype.returnUserProfileCardShiftScreens = function (data,phoneNumber){
    return(
        <Card
            style={[
                Styles.OrdersScreenCardshadow,Styles.bgLBlueWhite,Styles.marV10,Styles.br0,Styles.p5]}>
            <Card.Title
                left={() =>
                    <View>
                        {Services.prototype.getUserProfilePic(data.profilePicUrl)}
                    </View>}
                title={<Text style={[Styles.f18,Styles.ffLBold]}>{_.startCase(_.toLower(data.name))}</Text>}
                titleStyle={[Styles.ffLBold, Styles.f18,Styles.colorBlue]}
                subtitleStyle={[Styles.ffLRegular]}
                subtitle={
                    <Text style={[Styles.f14,Styles.ffLBold,Styles.colorBlue]}>{data.status}{phoneNumber ? '('+phoneNumber +')': null }</Text>
                }
            >
            </Card.Title>
        </Card>
    )
}

Services.prototype.returnUserProfileCardTripVerification = function (data,phoneNumber){
    return(
        <Card
            style={[
                Styles.OrdersScreenCardshadow,Styles.bgLBlueWhite,Styles.br0,Styles.p5]}>
            <Card.Title
                left={() =>
                    <View>
                        {Services.prototype.getUserProfilePic(data ? data.profilePicUrl :'')}
                    </View>}
                title={<Text style={[Styles.f14,Styles.ffLBold]}>{data ? _.startCase(_.toLower(data.name)) : '--'}</Text>}
                titleStyle={[Styles.ffLBold, Styles.f14,Styles.colorBlue]}
                subtitleStyle={[Styles.ffLRegular]}
                subtitle={
                    <Text style={[Styles.f12,Styles.ffLBold, Styles.colorBlue]}>{data ? data.status :'--'}{phoneNumber ? ' ('+phoneNumber +')': null }</Text>
                }
            >
            </Card.Title>
        </Card>
    )
}

//Shift Status
Services.prototype.getShiftStatusName = function (status) {
    if (status === 'SHIFT_ENDED') {
        return 'Shift Ended';
    } else if (status === 'ATTENDANCE_MARKED') {
        return 'Attendance Marked';
    } else if (status === 'SHIFT_IN_PROGRESS') {
        return 'Shift in Progress';
    } else if (status === 'SHIFT_CANCELLED_BY_SUPERVISOR') {
        return 'Shift Cancelled by Supervisor'
    } else if (status === 'SHIFT_AUTOCLOSED') {
        return 'Shift Autoclosed'
    } else if (status === 'INIT') {
        return 'Not Reported'
    } else if (status === 'SHIFT_SUSPENDED') {
        return 'Shift Suspended'
    } else if (status === "SHIFT_ENDED_BY_SUPERVISOR") {
        return 'Shift Ended By Supervisor'
    } else if (status === "SHIFT_CLOSED_BY_SUPERVISOR") {
        return 'Shift Closed By Supervisor'
    } else if (status === "REPORTED_ABSENT") {
        return 'Reported Absent'
    } else {
        return status
    }
};

// Services.prototype.getShiftStatusColours = function (status) {
//     if (status === 'SHIFT_ENDED') {
//         return '#000';
//     } else if (status === 'ATTENDANCE_MARKED') {
//         return 'orange';
//     } else if (status === 'SHIFT_IN_PROGRESS') {
//         return 'green';
//     } else if (status === 'INIT') {
//         return 'grey'
//     } else if (status === 'SHIFT_CANCELLED_BY_SUPERVISOR' || status === 'REPORTED_ABSENT' || status === 'SHIFT_SUSPENDED' || status === 'SHIFT_CLOSED_BY_SUPERVISOR') {
//         return 'red'
//     } else if (status === 'SHIFT_AUTOCLOSED') {
//         return '#A52A2A'
//     } else {
//         return '#ADD8E6'
//     }
// };

Services.prototype.getShiftStatusColours = function (status) {
    if (status === 'SHIFT_ENDED') {
        return '#28a745';
    } else if (status === 'ATTENDANCE_MARKED') {
        return '#0f7bff';
    } else if (status === 'SHIFT_IN_PROGRESS') {
        return '#17a2b8';
    } else if (status === 'INIT') {
        return '#789ffe'
    } else if (status === 'SHIFT_CANCELLED_BY_SUPERVISOR') {
        return '#dc3545'
    } else if (status === 'SHIFT_SUSPENDED') {
        return '#F06292'
    } else if (status === 'SHIFT_CLOSED_BY_SUPERVISOR') {
        return '#ffc107'
    } else if (status === 'SHIFT_AUTOCLOSED') {
        return '#6f42c1'
    } else if (status === 'REPORTED_ABSENT') {
        return '#860000'
    } else if (status === 'SHIFT_ENDED_BY_SUPERVISOR') {
        return '#ffc107'
    } else {
        return '#ADD8E6'
    }
};

Services.prototype.getTripVerificationStatus = function (status) {
    if (status === 'VERIFIED') {
        return '#2CC990';
    } else if (status === 'PENDING') {
        return '#FCB941'
    } else if (status === 'REJECTED') {
        return '#FC6042'
    } else if (status === "PAID") {
        return '#2C82C9'
    } else if (status === 'DELETED') {
        return '#808080'
    } else if (status === 'TOPAY') {
        return '#6f42c1'
    } else if (status === 'CREATED') {
        return '#8b0000'
    } else if (status === 'UPDATED') {
        return '#1e90ff'
    }else if (status === 'REVERTED') {
        return '#DE3163'
    } else {
        return '#dce3fd'
    }
};

Services.prototype.getExpensesStatus = function (status) {
    if (status === 'APPROVED') {
        return '#2CC990';
    } else if (status === 'PENDING') {
        return '#FCB941'
    } else if (status === 'REJECTED') {
        return '#FC6042'
    } else if (status === "PAID") {
        return '#2C82C9'
    } else if (status === 'DELETED') {
        return '#808080'
    } else if (status === 'TOPAY') {
        return '#6f42c1'
    } else if (status === 'CREATED') {
        return '#8b0000'
    } else if (status === 'UPDATED') {
        return '#1e90ff'
    }else if (status === 'REVERTED') {
        return '#DE3163'
    } else {
        return '#ADD8E6'
    }
};

Services.prototype.returnExpenseIcons = function (name, size, color) {
    if (name === "Travel") {
        return (
            <MaterialIcons name="card-travel" size={size} color={color}/>
        )
    } else if (name === "Short Cash") {
        return (
            <MaterialCommunityIcons name="cash-100" size={size} color={color}/>
        )
    } else if (name === "Fees") {
        return (
            <MaterialCommunityIcons name="receipt" size={size} color={color}/>)
    } else if (name === "Furniture") {
        return (
            <MaterialCommunityIcons name="sofa" size={size} color={color}/>)
    } else if (name === "Stationary") {
        return (
            <MaterialIcons name="store" size={size} color={color}/>
        )
    } else if (name === "Postage") {
        return (
            <Zocial name="posterous" size={size} color={color}/>
        )
    } else if (name === "Utilities") {
        return (
            // <MaterialCommunityIcons name="tools" size={24} color="black" />
            <MaterialCommunityIcons name="toolbox" size={size} color={color}/>)
    } else if (name === "Maintenance") {
        return (
            <Entypo name="flashlight" size={size} color={color}/>
        )
    } else if (name === "StaffWelfare") {
        return (
            <FontAwesome5 name="first-aid" size={size} color={color}/>
        )
    } else if (name === "Adhoc") {
        return (
            <FontAwesome name="truck" size={size} color={color}/>
        )
    } else if (name === "Others" || name === "Other") {
        return (
            <MaterialIcons name="add-box" size={size} color={color}/>)
    } else if (name === "Cleaning") {
        return (
            <Entypo name="flat-brush" size={size} color={color}/>
        )
    } else if (name === "Repair & Services" || name === 'Repair & Maintenance') {
        return (
            <Ionicons name="ios-settings" size={size} color={color}/>
        )
    } else if (name === "Electrical") {
        return (
            <MaterialCommunityIcons name="power-plug" size={size} color={color}/>
        )
    } else if (name === "Civil Work") {
        return (
            <FontAwesome5 name="person-booth" size={size} color={color}/>
        )
    } else if (name === "Security") {
        return (
            <MaterialCommunityIcons name="security" size={size} color={color}/>
        )
    } else if (name === "Food" || name === "Food & Drink") {
        return (
            <MaterialCommunityIcons name="food" size={size} color={color}/>
        )
    } else if (name === "Tea & Coffee") {
        return (
            <MaterialCommunityIcons name="tea" size={size} color={color}/>
        )
    } else if (name === "Water") {
        return (
            <MaterialCommunityIcons name="water" size={size} color={color}/>
        )
    } else if (name === "Vehicle 2 Wheeler") {
        return (
            <FontAwesome name="motorcycle" size={size} color={color}/>
        )
    } else if (name === "Vehicle 4 Wheeler") {
        return (
            <MaterialCommunityIcons name="truck" size={size} color={color}/>
        )
    } else if (name === "ManPower") {
        return (
            <FontAwesome5 name="person-booth" size={size} color={color}/>)
    } else if (name === "Internet") {
        return (
            <MaterialCommunityIcons name="wifi" size={size} color={color}/>)
    } else if (name === "Phone") {
        return (
            <Entypo name="landline" size={size} color={color}/>)
    } else if (name === "Electricity") {
        return (
            <MaterialCommunityIcons name="power-plug" size={size} color={color}/>
        )
    } else if (name === "Router") {
        return (
            <MaterialCommunityIcons name="router-wireless" size={size} color={color}/>
        )
    } else if (name === "Printer") {
        return (
            <MaterialCommunityIcons name="printer" size={size} color={color}/>
        )
    } else if (name === "Laptop") {
        return (
            <MaterialCommunityIcons name="laptop-chromebook" size={size} color={color}/>
        )
    } else if (name === "Scanner") {
        return (
            <MaterialCommunityIcons name="qrcode-scan" size={size} color={color}/>
        )
    } else if (name === "Camera") {
        return (
            <FontAwesome name="camera" size={size} color={color}/>
        )
    } else if (name === "Weighing Scale") {
        return (
            <MaterialCommunityIcons name="weight-kilogram" size={size} color={color}/>
        )
    } else if (name === "Cash Machine") {
        return (
            <FontAwesome5 name="cash-register" size={size} color={color}/>
        )
    } else if (name === "Racks") {
        return (
            <Entypo name="browser" size={size} color={color}/>
        )
    } else if (name === "Table") {
        return (
            <FontAwesome5 name="table" size={size} color={color}/>
        )
    } else if (name === "Bins") {
        return (
            <Entypo name="shopping-bag" size={size} color={color}/>
        )
    } else if (name === "Chair") {
        return (
            <FontAwesome5 name="chair" size={size} color={color}/>
        )
    } else if (name === "Trolley") {
        return (
            <MaterialCommunityIcons name="human-wheelchair" size={size} color={color}/>
        )
    } else if (name === "Pallet") {
        return (
            <FontAwesome5 name="pallet" size={size} color={color}/>
        )
    } else if (name === "Accomodation") {
        return (
            <FontAwesome name="bed" size={size} color={color}/>
        )
    } else if (name === "Toll Charges") {
        return (
            <MaterialCommunityIcons name="billboard" size={size} color={color}/>
        )
    } else if (name === "Vaccination") {
        return (
        <Fontisto name="injection-syringe" size={size} color={color} />
        )
    } else {
        return (
            <FontAwesome name="address-card" size={size} color={color}/>
        )
    }
};

Services.prototype.convertTimeStamptoHM = function (timeStamp) {
    return (
        <CText>
            {new Date(timeStamp).getHours() <= 9 ? "0" + new Date(timeStamp).getHours() : new Date(timeStamp).getHours()}:
            {new Date(timeStamp).getMinutes() <= 9 ? "0" + new Date(timeStamp).getMinutes() : new Date(timeStamp).getMinutes()}
        </CText>
    )
};

Services.prototype.returnBoldTimeStampFormat = function (timeStamp) {
    return (
        <Text style={[Styles.ffMbold, Styles.f18]}>
            {new Date(timeStamp).getHours() <= 9 ? "0" + new Date(timeStamp).getHours() : new Date(timeStamp).getHours()}:
            {new Date(timeStamp).getMinutes() <= 9 ? "0" + new Date(timeStamp).getMinutes() : new Date(timeStamp).getMinutes()}
        </Text>
    )
};

Services.prototype.convertTimeStamptoBlueColorHM = function (timeStamp) {
    return (
        <Text style={[Styles.colorBlue]}>
            {new Date(timeStamp).getHours() <= 9 ? "0" + new Date(timeStamp).getHours() : new Date(timeStamp).getHours()}:
            {new Date(timeStamp).getMinutes() <= 9 ? "0" + new Date(timeStamp).getMinutes() : new Date(timeStamp).getMinutes()}
        </Text>
    )
};

Services.prototype.checkHMformat = function (Hours, Minutes) {
    return (
        <CText>
            {Hours <= 9
                ? "0" + Hours : Hours}:
            {Minutes <= 9
                ? "0" + Minutes : Minutes}
        </CText>
    )
};


Services.prototype.returnInHours = function (timeStamp) {
    return (
        new Date(timeStamp).getHours() <= 9 ? "0" + new Date(timeStamp).getHours() : new Date(timeStamp).getHours()
    )
};

Services.prototype.returnInMinutes = function (timeStamp) {
    return (
        new Date(timeStamp).getMinutes() <= 9 ? "0" + new Date(timeStamp).getMinutes() : new Date(timeStamp).getMinutes()
    )
};
Services.prototype.returnInServerFormat = function (timeStamp) {
    const year = new Date(timeStamp).getFullYear()
    const month = new Date(timeStamp).getMonth() + 1
    const day = new Date(timeStamp).getDate()
    // console.log('yy-mm-dd',year,month,day);
    return (
        year + '-' + month + '-' + day
    )
};

Services.prototype.returnServerBasedColor = function (screen) {
    if (Config.routes.BASE_URL === "http://testing.whizzard.in") {
        return '#FF0000';
    // } else if (Config.routes.BASE_URL === "http://api.whizzard.in") {
    } else if (Config.routes.BASE_URL === "http://mobileapi.whizzard.in") {
        return screen === 'login' ? '#36A84C' : '#000'
        // '#36A84C'
    } else {
        return '#f3cc14'
    }
};

Services.prototype.returnAPKdate = function () {
   return(
       Config.routes.showAPKDate
           ?
           <Text style={[Styles.colorBlue,Styles.f14,Styles.aslCenter]}>{Config.routes.APK_DATA}</Text>
           :
           null
   )
};

//used at cash closure dont use at other
Services.prototype.returnCalculatedAmount = function (targetValue,firstValue, secondValue,thirdValue,firstKey,secondKey,message) {
    let response = {};
    let totalBalance = (firstValue ? JSON.parse(firstValue) : 0) + (secondValue ? JSON.parse(secondValue) : 0) - (thirdValue ? JSON.parse(thirdValue) : 0)
    let closingBalanceError = 'Closing Balance should be ' + totalBalance;
    // console.log('calculated totalbalance',totalBalance)
    return totalBalance;
};

//used at cash closure dont use at other
Services.prototype.returnCalculatedShortCash = function (firstValue, secondValue) {
    // console.log('caluculated short start',firstValue,secondValue)
    // console.log('caluculated short cash', totalBalance)
        return (firstValue ? JSON.parse(firstValue) : 0) - (secondValue ? JSON.parse(secondValue) : 0);
};

Services.prototype.returnRedStart = function () {
    return (
        <CText cStyle={[Styles.cRed, Styles.f18, Styles.ffMbold]}>*</CText>
    )
};

Services.prototype.returnRedStarText = function (text) {
    return (
        <CText cStyle={[Styles.colorBlue, Styles.f18, Styles.ffMbold]}>{text}{Services.prototype.returnRedStart()}</CText>
    )
};

Services.prototype.returnINRhtmlcode = function (value) {
    return (
        <CText cStyle={[Styles.cBlk, Styles.f14, Styles.ffMbold]}>&#x20B9; {value}</CText>
    )
};

Services.prototype.returnZoomIcon = function () {
    return (
        <MaterialIcons name="zoom-in" size={28} color="#000"  style={[Styles.ImageZoomIconPosition]} />
    )
};

Services.prototype.returnTripZoomIcon = function () {
    return (
        <MaterialIcons name="zoom-in" size={28} color="#000"  style={[Styles.ZoomIconPosition]} />
    )
};

Services.prototype.returnLocationTitle = function (value) {
    return (
        "Allow Whizzard to access Device and location Details"
    )
};
Services.prototype.returnLocationMessage = function (value) {
    return (
        // "Whizzard collects Device Id and Current Location data Always to check Device using Mock Location and also to Mark attendance, Foreground & Background locations during shift flow even when app is not in use"
        "\"Whizzard Collects Device Id and Current Location Data\" to find device's Mock Location everytime. Also captures locations while Marking attendance, Foreground & Background in shift flow even when app is not in use\""

        // "Whizzard collects location data to enable Mark Attendance, Foreground, & Background locations during shift flow even when the app is closed or not in use."
    )
};

Services.prototype.returnCheckingVehicleNumber = function (value) {

    const part1 = _.toUpper(value.part1) + ' - '
    const part2 = _.toUpper(value.part2) + ' - '
    const part3 = _.toUpper(value.part3) + ' - '
    const part4 = _.toUpper(value.part4)

    const Finalpart2 = value.part2 ? part2 : ''
    const Finalpart3 = value.part3 ? part3 : ''


    // console.log('returnCheckingVehicleNumber',part1 +Finalpart2 +Finalpart3 +part4);
    return (
        part1 + Finalpart2 + Finalpart3 + part4
    )
};

Services.prototype.returnIFSCStatusView = function (check) {

    return (
        check === 'Verified'
            ?
            <View style={[Styles.pLeft30, Styles.mBtm5, Styles.aslStart, Styles.row]}>
                <MaterialCommunityIcons name="check-circle" size={23}
                                        style={[Styles.aslCenter, Styles.bgWhite, Styles.br40]}
                                        color={'green'}/>
                <Text style={[Styles.colorBlue, Styles.f16, Styles.padH5, Styles.ffMbold]}>Verified</Text>
            </View>
            :
            check === 'NotVerified'
                ?
                <View style={[Styles.pLeft30, Styles.mBtm5, Styles.aslStart, Styles.row]}>
                    <MaterialCommunityIcons name="cancel" size={23}
                                            style={[Styles.aslCenter, Styles.bgWhite, Styles.br40]}
                                            color={'red'}/>
                    <Text style={[Styles.cRed, Styles.f16, Styles.padH5, Styles.ffMbold]}>IFSC Not Verified</Text>
                </View>
                :
                null

    )
};

Services.prototype.returnIFSCStatusViewTripVerification = function (check) {

    return (
        check === 'Verified'
            ?
            <View style={[Styles.pLeft10, Styles.mBtm5, Styles.aslStart, Styles.row]}>
                <MaterialCommunityIcons name="check-circle" size={23}
                                        style={[Styles.aslCenter, Styles.bgWhite, Styles.br40]}
                                        color={'green'}/>
                <Text style={[Styles.colorBlue, Styles.f16, Styles.padH5, Styles.ffMbold]}>Verified</Text>
            </View>
            :
            check === 'NotVerified'
                ?
                <View style={[Styles.pLeft10, Styles.mBtm5, Styles.aslStart, Styles.row]}>
                    <MaterialCommunityIcons name="cancel" size={23}
                                            style={[Styles.aslCenter, Styles.bgWhite, Styles.br40]}
                                            color={'red'}/>
                    <Text style={[Styles.cRed, Styles.f16, Styles.padH5, Styles.ffMbold]}>IFSC Not Verified</Text>
                </View>
                :
                null

    )
};

//used in Home Screen==will calculate endshift,completed because of endTime
Services.prototype.calculateShiftDuration = function (startTime, endTime) {
    let timeStart = new Date(startTime).getTime();
    let timeEnd = new Date(endTime).getTime();
    let hourDiff = timeEnd - timeStart; //in ms
    let secDiff = hourDiff / 1000; //in s
    let minDiff = hourDiff / 60 / 1000; //in minutes
    let hDiff = hourDiff / 3600 / 1000; //in hours
    let humanReadable = {};
    humanReadable.hours = Math.floor(hDiff);
    humanReadable.minutes = Math.floor(minDiff - 60 * humanReadable.hours);
    // console.log(humanReadable); //{hours: 0, minutes: 30}
    return (
        <CText> {humanReadable.hours}h {humanReadable.minutes} min </CText>
    )
};

Services.prototype.getShiftCardDetails = function (item) {
    return (
        <View style={[Styles.marH10, Styles.aslCenter, Styles.alignCenter, {paddingVertical: 10}]}>
            <CText
                cStyle={[Styles.f18, Styles.aslCenter, Styles.cBlk, Styles.ffMbold]}>{item.attributes.clientName}</CText>
            <CText
                cStyle={[Styles.f18, Styles.aslCenter, Styles.cBlk, Styles.ffMbold]}>{item.attributes.siteName}</CText>
            <CText
                cStyle={[Styles.f18, Styles.aslCenter, Styles.cBlk, Styles.ffMbold]}>({item.attributes.siteCode})</CText>
            {
                item.clientUserIdInfo
                    ?
                    item.clientUserIdInfo.clientUserId
                        ?
                        <CText
                            cStyle={[Styles.f18, Styles.aslCenter, Styles.cBlk, Styles.ffMregular]}><CText
                            cStyle={[Styles.f18, Styles.aslCenter, Styles.cBlk, Styles.ffMbold]}>{item.clientUserIdInfo.clientUserId}</CText></CText>
                        :
                        null
                    :
                    null
            }
            {
                item.vehicleType === 0
                    ?
                    null
                    :
                    <Image
                        style={[Styles.img55, Styles.aslCenter]}
                        source={item.vehicleType === 2 ? LoadImages.vehicle_two : item.vehicleType === 3 ? LoadImages.vehicle_three : item.vehicleType === 4 ? LoadImages.vehicle_four : null}
                    />
                // <CText cStyle={[Styles.f18, Styles.aslCenter, Styles.cBlk, Styles.ffMbold]}>{ item.vehicleType === 2 ? 'Two Wheeler':item.vehicleType === 3?'Three Wheeler':item.vehicleType ===4?'Four Wheeler':null }</CText>
            }

        </View>
    )
};
Services.prototype.getSupervisorList = function (item, screen) {
    return (
        <TouchableOpacity onPress={() => {
            Linking.openURL(`tel:${item.phoneNumber}`)
        }}>
            <Card
                style={[styles.shadow, Styles.mBtm10, Styles.padH5, {borderColor: screen === 'summary' ? '#FFF' : "#FFA500"}, Styles.bw1, {borderRadius: 0,}]}>
                <Card.Title theme={theme}
                            style={[Styles.bgWhite, Styles.ffMregular]}
                            title={_.startCase(item.userName)}
                            subtitle={Services.prototype.returnRoleName(item.supervisorRole)}
                            subtitleStyle={[Styles.ffMregular, Styles.cBlk, Styles.f14]}
                            titleStyle={[Styles.ffMregular, Styles.cBlk, Styles.f16]}
                            left={() => this.getUserProfilePic(item.profilePicUrl)}
                            right={() => <IconButton icon="phone" onPress={() => {
                                Linking.openURL(`tel:${item.phoneNumber}`)
                            }}/>}
                />
            </Card>
        </TouchableOpacity>


    )
};

Services.prototype.successIcon = function () {
    return (<MaterialIcons name='check' color='green' size={30}
                           style={{position: 'absolute', right: 15, top: 18}}/>)
};

Services.prototype.errorIcon = function () {
    return (
        <MaterialIcons name='clear' color='red' size={30}
                       style={{position: 'absolute', right: 15, top: 18}}/>
    )
};

Services.prototype.returnTextInputErrorMessage = function (message) {
    return (
        <Text style={{
            color: 'red',
            fontFamily: 'Muli-Regular',
            paddingLeft: 20, marginBottom: 5
        }}>{message}</Text>
    )
};

Services.prototype.returnConvertTimeToAMPM = function (date) {
    var todayDate = date.toDateString();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return todayDate + ' ' + hours + ':' + minutes + ' ' + ampm;
};

// WareHouse popup cards ===siteName,Marked Attendance,expectedDuration
Services.prototype.returnWareHouseCards = function (ShiftDetails) {
    return (
        <View>
            <Card.Content style={[Styles.aslCenter, Styles.p5]}>
                <FastImage style={[Styles.aslCenter, Styles.img100, Styles.p10]}
                           source={LoadImages.siteWareHouse}/>
                <Title
                    style={[Styles.cBlk, Styles.f20, Styles.ffMbold, Styles.aslCenter,]}>{ShiftDetails.siteName}</Title>
            </Card.Content>

            <Card.Title
                titleStyle={[Styles.f16, Styles.ffMregular]}
                style={[Styles.marV5, Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                title={<Text style={[Styles.f16, Styles.ffMregular, Styles.cBlk]}>Marked Attendance
                    at {ShiftDetails.attributes.markedAttendanceTime}</Text>}
                // at {this.returnBoldTimeStampFormat(ShiftDetails.reportingTime)}</Text>}
                left={() => <FastImage style={{width: 40, height: 40}}
                                       source={LoadImages.markedAttendance}/>}
            />
            <Card.Title
                titleStyle={[Styles.f16, Styles.ffMregular]}
                style={[Styles.marV5, Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                title={<Text>
                    Expected Shift Duration <Text style={{
                    fontFamily: 'Muli-Bold',
                    fontSize: 18
                }}>{ShiftDetails.attributes.expectedDuration}</Text>
                </Text>}
                left={() => <Ionicons style={[Styles.marH5]} name="ios-alarm"
                                      size={40}
                                      color="red"/>}
            />
        </View>
    )
};

//used in team listing
Services.prototype.getShiftTimings = function (item) {
    return (
        ((item.expectedStartTime.hours <= 9 ? "0" + item.expectedStartTime.hours : item.expectedStartTime.hours) + ':' +
            (item.expectedStartTime.minutes <= 9 ? "0" + item.expectedStartTime.minutes : item.expectedStartTime.minutes)) + ' to ' +
        ((item.expectedEndTime.hours <= 9 ? "0" + item.expectedEndTime.hours : item.expectedEndTime.hours) + ':' +
            (item.expectedEndTime.minutes <= 9 ? "0" + item.expectedEndTime.minutes : item.expectedEndTime.minutes)))
};

//used in calender cards
Services.prototype.returnExpectedTimings = function (item) {
    return (
        ((item.startTime.hours <= 9 ? "0" + item.startTime.hours : item.startTime.hours) + ':' +
            (item.startTime.minutes <= 9 ? "0" + item.startTime.minutes : item.startTime.minutes)) + ' to ' +
        ((item.endTime.hours <= 9 ? "0" + item.endTime.hours : item.endTime.hours) + ':' +
            (item.endTime.minutes <= 9 ? "0" + item.endTime.minutes : item.endTime.minutes)))
};

//used in calender timeline
Services.prototype.returnHMformat = function (item) {
    return (
        ((item.startTime.hours <= 9 ? "0" + item.startTime.hours : item.startTime.hours) + ':' +
            (item.startTime.minutes <= 9 ? "0" + item.startTime.minutes : item.startTime.minutes)))
};

//used in trip reports
Services.prototype.returnHMformatFromTimeStamp = function (item) {
    let hours = new Date(item).getHours()
    let minutes = new Date(item).getMinutes()
    return (
        ((hours <= 9 ? "0" + hours : hours) + ':' +
            (minutes <= 9 ? "0" + minutes : minutes)))
};

Services.prototype.returnStatusText = function (shiftStatus) {
    // console.log('shiftStatus',shiftStatus);
    return (
        <View style={[Styles.aslCenter, Styles.flex1]}>
            <View style={[Styles.aslCenter]}>
                {LoadSVG.whizzard_logo}
            </View>
            {
                shiftStatus === "ATTENDANCE_MARKED"
                    ?
                    <Text style={[Styles.ffMbold, Styles.f20, Styles.cBlk,]}>Shift yet to start</Text>
                    :
                    shiftStatus === "SHIFT_IN_PROGRESS"
                        ?
                        <Text style={[Styles.ffMbold, Styles.f20, Styles.cBlk,]}>Shift in progress</Text>
                        :
                        shiftStatus === "ENDED_SHIFT"
                            ?
                            <Text style={[Styles.ffMbold, Styles.f20, Styles.cBlk,]}>Shift ended</Text>
                            :
                            shiftStatus === "SHIFT_CANCELLED"
                                ?
                                <Text style={[Styles.ffMbold, Styles.f20, Styles.cBlk,]}>Shift cancelled</Text>
                                :
                                null

            }
        </View>
    )
};

Services.prototype.returnVoucherStatus = function (status) {
    if (status === 'APPROVAL_PENDING') {
        return "Pending"
    } else if (status === 'APPROVED') {
        return "Approved"
    } else if (status === 'REJECTED') {
        return "Rejected"
    } else if (status === 'PAYMENT_PROCESSED') {
        return "Payment Processed"
    } else return 'NA'
};

Services.prototype.getOrderStatus = function (value) {
    if (value === 'AT_DC') {
        return "AT DC"
    } else if (value === 'READY_FOR_PICKUP') {
        return "PICK UP"
    } else if (value === 'OUT_ON_ROAD') {
        return 'OUT ON ROAD'
    } else if (value === 'DELIVERED') {
        return 'DELIVERED'
    } else if (value === 'CANCELLED') {
        return 'CANCELLED'
    } else if (value === "REJECTED") {
        return "REJECTED"
    } else if (value === "ATTEMPTED") {
        return "ATTEMPTED"
    } else if (value === "PARTIALLY_DELIVERED") {
        return "PARTIALLY DELIVERED"
    } else if (value === "REJECTED_BY_CUSTOMER") {
        return "REJECTED BY CUSTOMER"
    } else if (value === "REJECTED_BY_DA") {
        return "REJECTED BY DA"
    } else return value
};

Services.prototype.getOrderItemStatus = function (value) {
    if (value === 'AT_DC') {
        return "AT DC"
    } else if (value === 'READY_FOR_PICKUP') {
        return "pick up"
    } else if (value === 'OUT_ON_ROAD') {
        return 'Out On Road'
    } else if (value === 'DELIVERED') {
        return 'Delivered'
    } else if (value === 'CANCELLED') {
        return 'Cancelled'
    } else if (value === "REJECTED") {
        return "Rejected"
    } else if (value === "ATTEMPTED") {
        return "Attempted"
    } else if (value === "PARTIALLY_DELIVERED") {
        return "Partially Delivered"
    } else if (value === "REJECTED_BY_CUSTOMER") {
        return "Rejected by Customer"
    } else if (value === "REJECTED_BY_DA") {
        return "Rejected by DA"
    } else return value
};

Services.prototype.getOrderType = function (type) {
    if (type === 1) {
        return "PICK"
    } else if (type === 2) {
        return "DROP"
    } else if (type === 3) {
        return 'CANCEL'
    } else return null
};

Services.prototype.returnOrderListColor = function (status) {
    return (
        status === 'READY_FOR_PICKUP' ? Styles.colorOrangeYellow :
            status === 'OUT_ON_ROAD' ? Styles.cBlue :
                status === 'DELIVERED' ? Styles.colorGreen :
                    status === 'PARTIALLY_DELIVERED' ? Styles.cVoiletPinkMix :
                        status === 'ATTEMPTED' ? Styles.cBlueGreenMix :
                            status === 'REJECTED' || status === 'REJECTED_BY_DA' || status === 'REJECTED_BY_CUSTOMER' || status === 'CANCELLED' ? Styles.cRed : Styles.cBlk
    )
};

Services.prototype.returnOrderColorCode = function (status) {
    return (
        status === 'READY_FOR_PICKUP' ? '#f3cc14' :
            status === 'OUT_ON_ROAD' ? '#1e90ff' :
                status === 'DELIVERED' ? '#36A84C' :
                    status === 'PARTIALLY_DELIVERED' ? '#CF268A' :
                        status === 'ATTEMPTED' ? '#db99ff' :
                            status === 'REJECTED' || status === 'REJECTED_BY_DA' || status === 'REJECTED_BY_CUSTOMER' || status === 'CANCELLED' ? '#FF0000' : '#000000'
    )
};

Services.prototype.showProfileScreensStatus = function (type) {
    return (
        <View style={[Styles.defaultbgColor]}>
            <View style={[Styles.ProfileScreensStatusPositionAbs]}>
            </View>
            <View style={[Styles.row, Styles.p15, Styles.jSpaceBet,]}>
                <View>
                    <MaterialCommunityIcons name="check-circle" size={40}
                                            style={[Styles.aslCenter, Styles.bgWhite, Styles.br40]}
                                            color={type === 'PERSONAL' ? "#b3b3b3" : 'green'}/>
                    <Text style={[Styles.cWhite, Styles.f16, Styles.ffMextrabold, Styles.aslCenter]}>Personal</Text>
                    <Text style={[Styles.cWhite, Styles.f16, Styles.ffMextrabold, Styles.aslCenter]}>Info</Text>
                </View>
                <View>
                    <MaterialCommunityIcons name="check-circle" size={40}
                                            style={[Styles.aslCenter, Styles.bgWhite, Styles.br40]}
                                            color={type === 'VEHICLE' || type === 'BANK' ? 'green' : "#b3b3b3"}/>
                    <Text style={[Styles.cWhite, Styles.f16, Styles.ffMextrabold, Styles.aslCenter]}>Vehicle</Text>
                    <Text style={[Styles.cWhite, Styles.f16, Styles.ffMextrabold, Styles.aslCenter]}>Details</Text>
                </View>
                <View>
                    <MaterialCommunityIcons name="check-circle" size={40}
                                            style={[Styles.aslCenter, Styles.bgWhite, Styles.br40]}
                                            color={type === 'BANK' ? 'green' : "#b3b3b3"}/>
                    <Text style={[Styles.cWhite, Styles.f16, Styles.ffMextrabold, Styles.aslCenter]}>Bank</Text>
                    <Text style={[Styles.cWhite, Styles.f16, Styles.ffMextrabold, Styles.aslCenter]}>Details</Text>
                </View>
            </View>
        </View>
    )
}

Services.prototype.checkGPSpermissions = function () {
    RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({interval: 10000, fastInterval: 5000})
        .then(data => {
            // console.log('inside GPS check', data);
            Services.prototype.checkLocationPermissions()
            // The user has accepted to enable the location services
            // data can be :
            //  - "already-enabled" if the location services has been already enabled
            //  - "enabled" if user has clicked on OK button in the popup
        }).catch(err => {
        // console.log('error GPS check', err);
        // console.log('error code GPS check ', err.code);
        Utils.dialogBox('GPS permissions denied', '');
        // Services.prototype.checkGPSpermissions()
        // The user has not accepted to enable the location services or something went wrong during the process
        // "err" : { "code" : "ERR00|ERR01|ERR02", "message" : "message"}
        // codes :
        //  - ERR00 : The user has clicked on Cancel button in the popup
        //  - ERR01 : If the Settings change are unavailable
        //  - ERR02 : If the popup has failed to open
    });
};

Services.prototype.returnNotificationActivity = function (Activity) {
    return (
        Activity.attrs
            ?
            Activity.attrs.attendanceStatus
                ?
                <CText
                    cStyle={[Activity.attrs.attendanceStatus === "REJECTED" ? Styles.cRed : Styles.colorGreen, Styles.f14, Styles.ffMbold]}>{'  '}({Activity.attrs.attendanceStatus})</CText>
                :
                null
            :
            null
    )
};

Services.prototype.returnCurrencyImages = function (currencyValue) {
    return(
        currencyValue === 1
        ?
            <Image
                style={[ {height: 50, width: 100},Styles.ImgResizeModeContain,Styles.bgWhite]}
                source={LoadImages.note1}/>
            :
            currencyValue === 2
                ?
                <Image
                    style={[ {height: 50, width: 100},Styles.ImgResizeModeContain,Styles.bgWhite]}
                    source={LoadImages.note2}/>
                :
                currencyValue === 5
                    ?
                    <Image
                        style={[ {height: 50, width: 100},Styles.ImgResizeModeContain,Styles.bgWhite]}
                        source={LoadImages.note5}/>
                    :
                    currencyValue === 10
                    ?
                    <Image
                        style={[ {height: 50, width: 100},Styles.ImgResizeModeContain,Styles.bgWhite]}
                        source={LoadImages.note10}/>
                    :
                        currencyValue === 20
                            ?
                            <Image
                                style={[ {height: 50, width: 100},Styles.ImgResizeModeContain,Styles.bgWhite]}
                                source={LoadImages.note20}/>
                            :
                            currencyValue === 50
                                ?
                                <Image
                                    style={[ {height: 50, width: 100},Styles.ImgResizeModeContain,Styles.bgWhite]}
                                    source={LoadImages.note50}/>
                                :
                                currencyValue === 100
                                    ?
                                    <Image
                                        style={[ {height: 50, width: 100},Styles.ImgResizeModeContain,Styles.bgWhite]}
                                        source={LoadImages.note100}/>
                                    :
                                    currencyValue === 200
                                        ?
                                        <Image
                                            style={[ {height: 50, width: 100},Styles.ImgResizeModeContain,Styles.bgWhite]}
                                            source={LoadImages.note200}/>
                                        :
                                        currencyValue === 500
                                            ?
                                            <Image
                                                style={[ {height: 50, width: 100},Styles.ImgResizeModeContain,Styles.bgWhite]}
                                                source={LoadImages.note500}/>
                                            :
                                            currencyValue === 2000
                                                ?
                                                <Image
                                                    style={[ {height: 50, width: 100},Styles.ImgResizeModeContain,Styles.bgWhite]}
                                                    source={LoadImages.note2000}/>
                                                :
                                                <Image
                                                    style={[ {height: 50, width: 100},Styles.ImgResizeModeContain,Styles.bgWhite]}
                                                    source={LoadImages.note10}/>
    )
}

Services.prototype.returnNotificationIcons = function (Activity) {
    return (
        Activity.type === "SHIFT_CREATED" ?
            <FastImage
                style={[Styles.img35, Styles.aslCenter]}
                source={LoadImages.documents}
            />
            :
            Activity.type === "MARKED_ATTENDANCE" ?
                <FastImage
                    style={[Styles.img35, Styles.aslCenter]}
                    source={LoadImages.routePoint}
                />
                :
                Activity.type === "STARTED_SHIFT" ?
                    <FastImage
                        style={[Styles.img35, Styles.aslCenter]}
                        source={LoadImages.endpoint}
                    />
                    :
                    Activity.type === "UPDATED_PACKAGES" ?
                        <FastImage
                            style={[Styles.img35, Styles.aslCenter]}
                            source={LoadImages.delivery}
                        />
                        :
                        Activity.type === "ENDED_SHIFT" ?
                            <FastImage
                                style={[Styles.img35, Styles.aslCenter]}
                                source={LoadImages.ended_Shift}
                            />
                            :
                            Activity.type === "SHIFT_CANCELLED" || Activity.type === 'REPORTED_ABSENT' ?
                                <FastImage
                                    style={[Styles.img35, Styles.aslCenter]}
                                    source={LoadImages.notReached}
                                />
                                :
                                Activity.type === "NOT_MARKED_AT_SITE" || Activity.type === "NOT_ENDED_AT_SITE" ?
                                    <View style={[Styles.aslCenter]}>
                                        {LoadSVG.marker_yesterday}
                                    </View>
                                    :
                                    Activity.type === "BIRTHDAY_WISHES"
                                        ?
                                        <FontAwesome name="birthday-cake" size={30} style={[Styles.aslCenter]}
                                                     color="#f3cc14"/>
                                        :
                                        Activity.type === "OCCASIONAL"
                                            ?
                                            <MaterialIcons name="card-giftcard" size={30} style={[Styles.aslCenter]}
                                                           color="green"/>
                                            :
                                            Activity.type === "PROXY_USER_LOGIN"
                                                ?
                                                <MaterialIcons name="error-outline" size={35} style={[Styles.aslCenter]}
                                                               color="red"/>
                                                :
                                            Activity.type === "ATTENDANCE_LOG"
                                                ?
                                                <MaterialIcons name="notifications-active" size={35} style={[Styles.aslCenter]}
                                                               color="#000"/>
                                                :
                                                Activity.type === "LOCKED_USER"
                                                ?
                                                    <View style={[Styles.aslCenter]}>
                                                        {LoadSVG.trainingDisable}
                                                    </View>
                                                :
                                                    Activity.type === "UNLOCKED_USER"
                                                ?
                                                        <View style={[Styles.aslCenter]}>
                                                            {LoadSVG.doneIcon}
                                                        </View>
                                                :
                                                Activity.type === "Trip_Verification"
                                                    ?
                                                    <MaterialIcons name="notifications-active" size={35} style={[Styles.aslCenter]}
                                                                   color="#000"/>
                                                :
                                                Activity.type === "ATTENDANCE_PERMISSION" && Activity.attrs.attendanceStatus === null
                                                    ?
                                                    <MaterialIcons name="notifications-active" size={30}
                                                                   style={[Styles.aslCenter]} color="red"/>
                                                    :
                                                    Activity.type === "ATTENDANCE_PERMISSION" && Activity.attrs.attendanceStatus
                                                        ?
                                                        <MaterialIcons name="cloud-done" size={30}
                                                                       style={[Styles.aslCenter]} color="green"/>
                                                        :
                                                        Activity.type === "ORDER_PICKUP" || Activity.type === "ORDER_PICKUP_NOTIFICATION"
                                                        ?
                                                            <FastImage
                                                                style={[Styles.img35, Styles.aslCenter]}
                                                                source={LoadImages.pickup}
                                                            />
                                                        :
                                                        // <FastImage
                                                        //     style={[Styles.img35, Styles.aslCenter]}
                                                        //     source={LoadImages.disabled_endpoint}
                                                        // />
                                                        <MaterialIcons name="notifications" size={35} style={[Styles.aslCenter]}
                                                                       color="#000"/>

    )
};

Services.prototype.checkLocationPermissions = function () {
    try {
        const granted = PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            Geolocation.getCurrentPosition(
                (position) => {
                    // const currentLocation = position.coords;
                },
                (error) => {
                    console.log(error.code, error.message);
                    Utils.dialogBox(error.message, '')
                }
            );
        } else {
            console.log('offline location deined')
        }
    } catch (err) {
        Utils.dialogBox(err, '')
    }
};

Services.prototype.agreementData = function () {
    return (
        <Text style={[Styles.ffMregular, Styles.f14]}>
            <Text style={[Styles.ffMbold]}>Zipzap Logistics Private Limited </Text> (hereinafter referred to as
            “Whizzard”) is pleased to work with you as its trusted service provider for transport and other
            logistics-related tasks on an assignment basis.

            The principal terms and conditions of this relationship are as follows:{"\n"}

            1. You must provide copies of valid, self-attested photo-ID proof of documents as per the Document Checklist
            issued by Whizzard.{"\n"}{"\n"}

            2. You are entitled to payment only if :{"\n"}
            a. you are not absent without leave/intimation;{"\n"}
            b. you provide services in accordance with the details of the task assigned by Whizzard, and{"\n"}
            c. you provide clear updates on status of tasks when asked, and
            d. there is no loss or damage of any goods or persons during the performance of tasks, and
            e. you deposit of all of the COD collections at the end of each day.{"\n"}{"\n"}

            Whizzard’s staff will verify that these conditions have been fulfilled.{"\n"}{"\n"}

            3. If goods or assets are in your custody, it is your sole responsibility.{"\n"}{"\n"}

            4. You understand that you cannot provide similar services even on an assignment basis to other companies
            without first taking Whizzard’s permission.{"\n"}{"\n"}

            5. Failure to fulfil conditions is likely to result in penalty of at least 20% of payment due, termination
            of services and, where necessary, legal action including police complaints.{"\n"}{"\n"}

            6. Payment:{"\n"}
            a. You will be paid basis agreed schedule of rates as documented in this agreement or basis updated rates
            schedule and agreed payment plans communicated to you by Whizzard’s Site Supervisors/ Managers. These are
            subject to change on a short notice.{"\n"}
            b. If you have a problem with the payment, you must inform Whizzard’s staff and within twenty-four (24)
            hours send a message on Whatsapp +91 82972 97000 or email at help@whizzard.in.{"\n"}
            c. Payments will only happen electronically into the bank account that has been submitted by you, net of
            deductions.{"\n"}{"\n"}

            7. The agreement may be immediately terminated by Whizzard if you don’t meet the main conditions of the
            assignment or if there is no further requirement. You may also terminate this Agreement by giving 30 days
            notice.{"\n"}

            Accepted:{"\n"}{"\n"}

            [Signature, name, date]{"\n"}{"\n"}


            CONTRACT SERVICES AGREEMENT{"\n"}{"\n"}

            This Contract Services Agreement (“Agreement”) is made and entered into at
            (Hyderabad/Bangalore/Mumbai/Chennai) as on the date of acceptance of the agreement (“Effective Date”) by YOU
            (“the Service Provider”) for the Services described below and Zipzap Logistics Private Limited, having its
            registered office at 132, Marigold Tower, L&T Serene County, Gachibowli, Hyderabad – 500032, Telangana
            (hereinafter referred to as “Whizzard”), which expression shall, unless repugnant to the meaning or context
            thereof, be deemed to mean and include its affiliates, successors in business and assigns.{"\n"}{"\n"}

            Whizzard and Service Provider shall be referred to collectively as the “Parties” and individually as a
            “Party”.{"\n"}{"\n"}

            WHEREAS:{"\n"}
            A. Whizzard is engaged in the provision of logistics-related services to its customers;{"\n"}
            B. The Service Provider has experience in the services sought by Whizzard;{"\n"}
            C. Whizzard wishes to avail from the Service Provider, services through purchase orders on the terms set out
            below; and{"\n"}{"\n"}

            NOW, THEREFORE, in consideration of the mutual agreements and covenants hereinafter set forth, Whizzard and
            Service Provider hereby agree as follows:{"\n"}{"\n"}

            1. DEFINITIONS{"\n"}
            1.1. The key terms outlined herein shall have the meaning as defined below:{"\n"}
            1.1.1. “Certificates” shall mean any documents required by the Service Provider to provide the Services,
            including but not limited to, vehicle registration certificate, driver’s licenses, vehicle fitness
            certificate, road tax paid certificate, pollution under control (PUC) certificate, commercial permits and
            insurance policy documents.{"\n"}
            1.1.2. “Client” shall mean any natural person, firm, governmental authority, joint venture, association,
            partnership or other entity (whether or not having a separate legal personality) who has availed the
            Services of Whizzard;{"\n"}
            1.1.3. “Goods” shall mean the consignment or any other assets provided to the Service Provider in relation
            to the Services.{"\n"}
            1.1.4. “Laws” shall mean the laws of India including all statutes, ordinances, rules, regulations, and
            legislative orders and their binding judicial interpretations.{"\n"}
            1.1.5. “Purchase Order” means any purchase order or written communication issued by Whizzard in accordance
            with Clause 3 of the Agreement.{"\n"}
            1.1.6. “Vehicle” shall mean any vehicle, including trucks, cars and two-wheelers used for the
            Services.{"\n"}{"\n"}

            1.2. In this Agreement, unless the context requires otherwise:{"\n"}
            1.2.1. a reference to this Agreement means this Agreement as amended, novated, supplemented, varied or
            replaced from time to time;{"\n"}
            1.2.2. a reference to 'including', 'includes' or 'include' must be read as if it is followed by '(without
            limitation)';{"\n"}
            1.2.3. where a word or an expression is defined, any other part of speech or grammatical form of that word
            or expression has a corresponding meaning;{"\n"}
            1.2.4. words in the singular include the plural and vice-versa;{"\n"}
            1.2.5. a reference to any legislation or legislative provision includes any statutory modification or
            re-enactment of, or legislative provision substituted for, and any sub-ordinated legislation issued under,
            that legislation or legislative provision;{"\n"}
            1.2.6. a reference to any Party includes that Party’s executors, administrators, substitutes, successors and
            permitted assigns;{"\n"}
            1.2.7. headings are for convenience only and do not affect interpretation of this Agreement; and{"\n"}
            1.2.8. no rule of construction applies to the disadvantage of a Party on the basis that the Party put
            forward this Agreement or any part of it.{"\n"}{"\n"}

            2. CONDITIONS PRECEDENT{"\n"}
            2.1. Each Party shall, and shall cause their various representatives, employees and agents to use reasonable
            efforts to fulfil the conditions precedent set out in Clauses 2.2 (hereinafter collectively referred to as
            the “Conditions Precedent”).{"\n"}{"\n"}

            2.2. To be appointed as a Service Provider, the Service Provider must:{"\n"}
            2.2.1. provide clear, complete, self-attested copies of the documents as set out in Exhibit 1 to this
            Agreement.{"\n"}
            2.2.2. consent to a background search being conducted and receive a favourable and unobjectionable report
            after such search.{"\n"}
            2.2.3. ensure that it has all necessary Certificates required to render Services under this
            Agreement.{"\n"}{"\n"}

            2.3. The Service Provider shall not be entitled to be on-boarded until the verification and satisfaction of
            the Conditions Precedent by Whizzard in its sole discretion.{"\n"}{"\n"}

            3. SERVICES{"\n"}
            3.1. The Service Provider understands that it has been engaged by Whizzard for itself, and/or for and/or on
            behalf of the Client on the terms set out in the Agreement to perform tasks (“Services”) in the role
            of:{"\n"}
            3.1.1. a Contract Supply Staff, the specific terms of which role are set forth in Schedule A of this
            Agreement;{"\n"}{"\n"}

            3.2. Whizzard shall provide instructions to the Service Provider related to the scope of work and operating
            plan, which may be updated and amended from time to time, through a Purchase Order including, but not
            limited to, standards of performance standards, levels and metrics measurement for the provision of Services
            (“Performance Metrics”) which may include factors such as:{"\n"}
            (a) satisfaction of Whizzard and Client and customer, as applicable;{"\n"}
            (b) timely reporting as per the terms of the Agreement;{"\n"}
            (c) conduct and personal grooming;{"\n"}
            (d) timelines and required percentage of completed Services.{"\n"}{"\n"}

            3.3. Time is of the essence:{"\n"}
            3.3.1. THE TIME(S) AND DATE(S) OF DELIVERY COMMUNICATED BY WHIZZARD IN TERMS OF CLAUSE 3.2 ARE OF THE
            ESSENCE.{"\n"}
            3.3.2. The Service Provider shall notify Whizzard immediately when the Service Provider has knowledge of any
            potential delay in completion of the Services.{"\n"}
            3.3.3. Whizzard, at its sole discretion may deduct or withhold payment or refuse Services performed more
            than 24 hours after the time and date for delivery specified by Whizzard in terms of this Clause 3 and/or
            the schedules to this Agreement and/or Purchase Orders. The Parties recognize that such price reduction is a
            genuine pre-estimate of Whizzard’s loss and is not intended to be a penalty.{"\n"}
            3.3.4. The above referred reduction in payment of Services by Whizzard shall not relieve the Service
            Provider of its obligations provide the Services.{"\n"}{"\n"}

            4. PAYMENT: TERMS AND MODALITIES{"\n"}
            4.1. Subject to the terms of this Agreement, the Service Provider is entitled to receive payment for the
            Services as per its specified role and the payment terms set forth in Schedule A as applicable, which may be
            updated and amended from time to time at Whizzard’s sole discretion and will be communicated to the Service
            Provider.{"\n"}{"\n"}

            4.2. Whizzard will make payment towards provision of Services directly in the Service Provider’s bank
            account on record.{"\n"}{"\n"}

            5. PENALTY{"\n"}
            5.1. If a Service Provider absconds without returning the assets given by Whizzard, Whizzard may choose to
            lodge an FIR, pursue a police complaint and/or intimate the relevant enforcement or judicial authorities
            and/or file and pursue appropriate legal actions.{"\n"}{"\n"}

            5.2. Whizzard may, at its discretion and without exclusion to other remedies under Law or under this
            Agreement, inform the Service Provider and/or implement appropriate penalties of twenty percent (20%) or any
            other percentage on the payment due under this Agreement if:{"\n"}
            5.2.1. the performance of Services is not as per the Performance Metrics for the provision of
            Services.{"\n"}
            5.2.2. any unaccounted monies referred to in Clause 2.2.4 of Schedule A are not duly returned in full or
            within the specified timeframe by the Service Provider.{"\n"}
            5.2.3. the Service Provider are absent without intimation and/or approval.{"\n"}{"\n"}

            6. TAXES AND DUTIES{"\n"}
            6.1. Unless otherwise specified in the Agreement, all rates and prices are inclusive of all applicable taxes
            and duties and such other like payments as may be payable under any applicable Law. The Service Provider
            shall be entirely responsible for payment of all applicable VAT, GST, consumption tax, service tax or other
            like taxes, and applicable duties, whether now or hereafter enacted or imposed, however designated, in
            accordance with general statutes and applicable tax law (hereafter "Taxes").{"\n"}{"\n"}

            6.2. Whizzard may deduct or withhold any Taxes from any payment to be made to the Service Provider under
            this Agreement as it may determine under applicable Law, and such reduced payment to the Service Provider
            will constitute full payment and settlement to the Service Provider.{"\n"}{"\n"}

            6.3. If applicable, Service Provider should raise a valid tax invoice under applicable law(s) and
            regulations within 30 days from the end of the month and the invoice should separately state the taxes
            collected by the Service Provider. If at any time credit is denied to Whizzard due to deficient tax invoice,
            the Service Provider must indemnify Whizzard against any denied credits as well as interest and penalties
            imposed on Whizzard as result of claiming credit against the deficient invoice.{"\n"}{"\n"}

            6.4. Whizzard will reimburse the Service Provider for all applicable road tax and toll charges incurred
            during the provision of Services.{"\n"}{"\n"}

            6.5. Both Whizzard and the Service Provider shall use all reasonable, legal and appropriate means in an
            attempt to ensure that any exposure relative to the recoverability of taxes, to the extent that they may be
            recoverable, are maximized.{"\n"}{"\n"}


            7. REPRESENTATIONS AND WARRANTIES{"\n"}
            7.1. The Service Provider represents and warrants that each of the representations, warranties and
            statements contained herein below, are true and correct as of the Effective Date as may be applicable:{"\n"}
            7.1.1. It has provided complete and accurate biographical and contact details, and identification documents,
            including through the App.{"\n"}
            7.1.2. It has full legal capacity to enter into this Agreement and to perform the obligations under this
            Agreement and has taken all action necessary to authorise such execution and delivery and the performance of
            such obligations;{"\n"}
            7.1.3. The Service Provider has no criminal record and/or has not violated any Law.{"\n"}
            7.1.4. The Service Provider has all necessary that Certificates required to render Services under this
            Agreement.{"\n"}
            7.1.5. The execution and delivery by the Service Provider of this Agreement and its performance of the
            obligations under each of them do not and shall not:{"\n"}
            (a) violate, conflict with or constitute a default under any Law, or{"\n"}
            (b) contravene any proceeding or order, judgment, injunction, decree, award, settlement or stipulation of or
            before any arbitrator, tribunal or governmental authority.{"\n"}{"\n"}

            7.2. Whizzard represents and warrants that each of the representations, warranties and statements contained
            herein below, are true and correct as of the Effective Date:{"\n"}
            7.2.1. Whizzard is a company duly incorporated under the Laws of India, validly existing and in good
            standing under the Laws of its jurisdiction and has all requisite power and authority to own and operate its
            business and properties and to carry on its business as such business is now being conducted and is duly
            qualified to do business in India and in any other jurisdiction in which the transaction of its business
            makes such qualification necessary;{"\n"}
            7.2.2. Whizzard has full legal capacity to enter into this Agreement and to perform its obligations under
            each of them and has taken all action necessary to authorise such execution and delivery and the performance
            of such obligations and of this Agreement, and its performance of the obligations under each of them do not
            and shall not:{"\n"}
            (a) conflict with or violate any provision of its incorporation documents or any other agreement to which it
            is a party; or{"\n"}
            (b) violate, conflict with or constitute a default under any Law, or{"\n"}
            (c) contravene any proceeding or order, judgment, injunction, decree, award, settlement or stipulation of or
            before any arbitrator, tribunal or governmental authority.{"\n"}{"\n"}

            8. INDEMNITY AND LIABILITY{"\n"}
            8.1. The Service Provider hereby agrees to indemnify and hold Whizzard harmless from and against any and all
            claims, liabilities, losses, damages, penalties, costs and expenses (including without limitation the
            attorneys' fees and costs suffered or paid indirectly or directly by Whizzard), arising out of any action,
            dispute or proceedings in relation to or arising out of the Service Provider’s obligations under the
            Agreement whether on account of the Service Provider’s intentional or unintentional acts, negligence,
            failure to comply with statutory requirements, gross negligence, or breach of any obligations or terms of
            the Agreement, material or otherwise, including the representations or warranties of the Service
            Provider.{"\n"}{"\n"}

            8.2. The foregoing remedies are in addition to other remedies set forth in this Agreement or otherwise
            available to the Parties in accordance with applicable law.{"\n"}{"\n"}

            8.3. In case of an accident of the Vehicle and/or other moveable and/or immoveable property during the
            provision of Services, the Service Provider is solely responsible and liable for any and all claims raised
            by it or any other party, including any claims for compensation for damage to the Vehicle and/or other
            moveable and/or immoveable property, or compensation for bodily injury or grievous hurt, and/or fines
            payable to any authority arising out of damage to any government or public property.{"\n"}{"\n"}

            8.4. Notwithstanding anything contained in this Agreement to the contrary, in no event shall Whizzard be
            liable to the Service Provider in connection with this agreement or the arrangements contemplated hereby for
            any indirect, incidental, consequential, punitive, special or other similar damages, whether or not due to
            the fault or negligence of Whizzard, and regardless of whether Whizzard has been advised of the possibility
            of such damages or losses. The limitations of liability shall apply to any such damages, however caused and
            regardless of the theory of liability, whether derived from contract, tort (including, but not limited to,
            negligence), or any other legal theory, even if Whizzard has been advised of the possibility of such damages
            and regardless of whether the limited remedies available under this Agreement fail of their essential
            purpose.{"\n"}{"\n"}

            8.5. In no event, regardless of the form of the claim (whether based in contract, infringement, negligence,
            strict liability, tort or otherwise) shall Whizzard’s liability to the Service Provider under this Agreement
            exceed an amount equal to the aggregate fixed price paid to the Service Provider as on the first date of the
            cause of action arising of such claim.{"\n"}{"\n"}

            9. OWNERSHIP{"\n"}
            9.1. The Service Provider agrees and acknowledges that it shall have no right to claim ownership over the
            Goods and/or any assets of Whizzard whether in the Service Provider’s custody and possession during the
            course of the provision of Services or otherwise, and waives all claims and rights of lien and ownership in
            relation thereof.{"\n"}{"\n"}

            9.2. The Service Provider further recognises and acknowledges Whizzard as the sole and undisputed owner of
            all data accessible or made available to it during the Term whether or not in connection with the provision
            of Services under the Agreement, including any documents created on the basis of such data and Confidential
            Information.{"\n"}{"\n"}

            10. CONFIDENTIAL INFORMATION{"\n"}
            10.1. The Service Provider agrees and understands that the data shared by Whizzard including in relation to
            the Services, schedule of rates specified in Schedule A, Whizzard or Client names and contact information,
            customer lists, pick-up and delivery locations and the Services being rendered (“Confidential Information”)
            are private and confidential.{"\n"}{"\n"}

            10.2. The Service Provider will not use Confidential Information for any purpose other than carrying out its
            obligations as set forth in this Agreement.{"\n"}{"\n"}

            10.3. The Service Provider agrees and understands that Confidential Information from the GPS device and/or
            smartphone devices or any other storage device cannot be copied, stored on a private device or disseminated
            to any third party.{"\n"}{"\n"}

            10.4. The Service Provider agrees and understands that, save and except for the limited purpose of provision
            of the Services, it is prohibited from the use and communication of any data of Whizzard or the Client
            including any communication which is{"\n"}
            10.4.1. unsolicited and/or{"\n"}
            10.4.2. may be construed as harassment, whether through language, multimedia content, or frequency of
            communication and/or{"\n"}
            10.4.3. contrary to applicable Law.{"\n"}{"\n"}

            11. RELATIONSHIP{"\n"}
            11.1. During the Term, as defined in Clause 13 of this Agreement, the Service Provider may not enter into
            any identical or similar arrangement as contemplated under this Agreement with any other entity engaged in
            business activities similar to that of Whizzard. Provided that the Service Provider may enter into such
            arrangement with another entity after obtaining written consent of and on such terms as may be prescribed by
            Whizzard.{"\n"}{"\n"}

            11.2. The Service Provider understands that it cannot delegate or subcontract the Services without seeking
            the prior written consent of Whizzard. In the event Whizzard consents to such subcontract, the subcontractor
            will be deemed to be the agent of Service Provider for the purposes of this Agreement and the Service
            Provider will continue to remain responsible to Whizzard for the duties discharged by such subcontractor in
            terms of the Agreement.{"\n"}

            11.3. The Parties hereby acknowledge that their relationship is solely on a principal-to-principal basis as
            prescribed under Law and under no circumstances will such relationship be construed as a partnership, a
            franchise, legal representative, a master-servant relationship, a principal-agent relationship or an
            employer-employee relationship.{"\n"}{"\n"}

            11.4. Notwithstanding anything contained in this Agreement to the contrary, this Agreement shall not under
            any circumstances be construed to create any employer-employee relationship between Whizzard and the Service
            Provider engaged to provide the Services.{"\n"}{"\n"}

            12. FORCE MAJEURE{"\n"}
            12.1. Neither Party shall be liable to the other Party if, and to the extent, for the non-performance or
            delay in performance of any of its obligations under this Agreement if such performance is prevented,
            restricted, delayed or interfered with due to circumstances beyond the reasonable control of the defaulting
            Party, such as fires, floods, explosions, pandemics, epidemics, accidents, acts of god, wars, riots,
            lockouts, or other concerted acts of the workforce and/or acts of government.{"\n"}{"\n"}

            13. TERM{"\n"}
            13.1. The term of this Agreement shall begin on the Effective Date and continue thereafter until terminated
            (the “Term”) in accordance with the terms and conditions hereof. The Term may be extended by mutual consent
            and agreement of the Parties.{"\n"}{"\n"}

            14. TERMINATION{"\n"}
            14.1. Whizzard may terminate this Agreement by issuing the Service Provider with a notice of not less than 7
            days prior to the intended date of termination of the Agreement.{"\n"}{"\n"}

            14.2. Notwithstanding anything contained in this Agreement to the contrary, Whizzard may, at its sole
            discretion, terminate this Agreement with cause:{"\n"}
            14.2.1. immediately without issuing any notice in the event of the Service Provider’s breach or
            non-compliance of the material terms and conditions of this Agreement, namely Clause 2 – Conditions
            Precedent, Clause 3 – Services (unless as carved out in Clause 14.2.3 herein), Clause 5.1 – Penalty, Clause
            7 – Representations and Warranties, Clause 9 – Ownership, Clause 10 – Confidential Information and Clause 11
            – Relationship.{"\n"}
            14.2.2. immediately without issuing any notice in the event the Service Provider is found to be under the
            influence of intoxicants, drugs or alcohol during the provision of Services, and/or indulges in illegal,
            criminal or tortious acts, misbehaviour, misconduct or abusive conduct including with the Client or
            Whizzard.{"\n"}
            14.2.3. either immediately and/or with three (3) day’s prior written notice in the event:{"\n"}
            (a) Whizzard is not satisfied with the Services provided.{"\n"}
            (b) the Service Provider breaches any non-material terms and conditions of the Agreement.{"\n"}
            (c) the Service Provider fails to meet the Performance Metrics.{"\n"}
            (d) the Service Provider fails to renew its Certificates as required under this Agreement in a timely
            manner.{"\n"}
            (e) the requirements of the Client are altered such that Whizzard is informed that the provision of Services
            is no longer necessary.{"\n"}
            (f) the Service Provider rejects any amendments or modifications made to the Agreement by
            Whizzard.{"\n"}{"\n"}

            14.3. The Service Provider may terminate the Agreement with written notice of 30 days which may be modified
            by mutual agreement by the Parties. In the event the Service Provider fails to provide such written notice,
            in lieu of such written notice, Whizzard may withhold any security amount, withhold any outstanding payment
            due to the Service Provider, and may choose not to issue an no-objection certificate required by the Service
            Provider for its business.{"\n"}{"\n"}

            14.4. After termination of the Agreement, the Service Provider must deliver all Goods in good condition,
            monies collected on behalf of Whizzard and assets belonging to Whizzard in working condition within 24 hours
            or any other period of time mutually agreed upon by the Parties. In the event the Service Provider fails to
            deliver up these items, Whizzard may at its option (i) withhold payment owed to the Service Provider, and/or
            (ii) institute criminal and/or civil actions against the Service Provider and/or (iii) inform the Client of
            the Service Provider’s conduct.{"\n"}{"\n"}

            15. GOVERNING LAW AND JURISDICTION{"\n"}
            15.1. This Agreement shall be governed by and construed in accordance with the Laws of India. Any and all
            claims, disputes, questions or controversies involving the Parties and arising out of or in connection with,
            or relating to this Agreement, shall be subject to the exclusive jurisdiction of the courts of
            Hyderabad/Secunderabad, Telangana, India.{"\n"}{"\n"}

            16. NOTICES{"\n"}
            16.1. Any notice, approval, request or other communication under this Agreement will be given in writing and
            will be deemed to have been delivered and given for all purposes when actually delivered.{"\n"}{"\n"}

            16.2. For the avoidance of doubt, it is clarified that all approvals to be provided in writing under this
            Agreement may be sent by any Party to the other Parties by e-mail and shall:{"\n"}
            16.2.1. specify a deadline by which such approval must be received by a Party in order for such Party to
            timely fulfil its obligations under this Agreement, and{"\n"}
            16.2.2. save for unavoidable circumstances, provide at least two (2) business days for each
            approval.{"\n"}{"\n"}

            16.3. Notices received after 5:00 pm local time, on weekends, or on holidays, shall be deemed to have been
            received on the next business day.{"\n"}{"\n"}

            If to Whizzard:{"\n"}
            Attn: City Manager, Name of the City.{"\n"}
            Email: help@whizzard.in{"\n"}
            Whatsapp: +91 82972 97000{"\n"}{"\n"}

            If to Service Provider:{"\n"}
            SMS/Whatsapp/emails will be sent at the addresses provided to Whizzard by the Service Provider.{"\n"}{"\n"}

            17. GENERAL{"\n"}
            17.1. Amendments. This Agreement may be amended or modified in writing by Whizzard and duly communicated to
            the Service Provider after the Effective Date. The Service Provider may reject any such change by providing
            Whizzard written notice of such rejection within two (2) weeks of the date such change being communicated to
            them.{"\n"}{"\n"}

            17.2. Waiver/Severability: Any waiver, in whole or in part of any provision of this Agreement will not be
            considered to be a waiver of any other provision. If any term of this Agreement is found to be unenforceable
            or invalid for any reason, all other terms will remain in full force and effect.{"\n"}{"\n"}

            17.3. Counterparts: This Agreement may be executed in counterparts, each of which will be deemed an original
            and all of which together will constitute one and the same.{"\n"}{"\n"}

            17.4. Order of Precedence: The following order of precedence shall be followed in resolving any
            inconsistencies between the terms of this Agreement, Schedules and the terms of any attached hereto or
            delivered hereunder:{"\n"}
            17.4.1. the terms contained in the applicable Schedule depending on the role of the Service Provider, as
            amended from time to time;{"\n"}
            17.4.2. the terms contained in the body of this Agreement and the Exhibits, as amended from time to time.
            Provided that the most recent terms and conditions communicated to the Service Provider shall always
            supersede/override the corresponding old terms of the Agreement.{"\n"}{"\n"}

            17.5. Entire Agreement: Unless otherwise specified or repugnant to the context, any reference to the
            Agreement shall include all exhibits, schedules and appendices set forth. This Agreement sets forth the
            entire agreement and supersedes any and all prior and contemporaneous agreements of the Parties, whether
            written or oral, with respect to the transactions set forth herein.{"\n"}{"\n"}

            17.6. Survival: The provisions of Clause 8 – Indemnity and Liability, Clause 9 – Ownership and Clause 10 –
            Confidential Information, this Clause 17.6 – Survival, hereof shall survive the termination of this
            Agreement for so long as necessary to effect their purpose.{"\n"}{"\n"}

            BY CLICKING ON THE ‘I ACCEPT’ BUTTON, THE SERVICE PROVIDER AGREES TO BE BOUND TO THE TERMS AND CONDITIONS OF
            THIS AGREEMENT.{"\n"}{"\n"}

            Schedule A{"\n"}{"\n"}

            Terms and conditions in relation to the appointment of Contract Supply Staff{"\n"}{"\n"}


            1. The Service Provider understands that it has been onboarded in the role of a Contract Supply Staff to
            provide Services.{"\n"}{"\n"}

            2. SERVICES{"\n"}

            2.1. The Contract Supply Staff understands that it has been engaged to provide Services including:{"\n"}
            2.1.1. completion of KYCs of entities including the Client;{"\n"}
            2.1.2. providing utility-related services;{"\n"}
            2.1.3. arranging and scheduling transportation, logistics and/or delivery services and/or to purchase
            certain products of Whizzard and/or Client.{"\n"}{"\n"}

            2.2. Whizzard shall provide instructions to the Contract Supply Staff related to the scope of work and
            operating plan, which may be updated and amended from time to time, through a Purchase Order
            including:{"\n"}
            2.2.1. the date and time of delivery of the Services.{"\n"}
            2.2.2. the pick-up and/or drop-off location for the Services. The Contract Supply Staff understands that the
            pick-up and/or drop-off location are subject to change depending on the requirements of the Client.{"\n"}
            2.2.3. the use of a single Vehicle for the Services. The Contract Supply Staff understands and agrees that
            transshipment is specifically prohibited by Whizzard, except:{"\n"}
            (a) in case of accident or breakdown of Vehicle; and/or{"\n"}
            (b) in case of accident or incapacity of the Contract Supply Staff;{"\n"}
            (c) upon securing written permission of Whizzard for such transshipment.{"\n"}
            2.2.4. the collection and deposit of money from the Client on behalf of Whizzard by the Contract Supply
            Staff, provided that:{"\n"}
            (a) where the Services are being rendered under the “cash-on-delivery” model, the Contract Supply Staff must
            remit the total cash collected at the end of the same day as the collection to the bank or in the
            alternative, to Whizzard’s authorised representative for reconciliation. In case of any discrepancy between
            actual collection and total amount deposited, the Contract Supply Staff shall remit the difference amount
            and update the same within twenty-four (24) hours failing which the Contract Supply Staff may be penalised
            twenty percent (20%) .{"\n"}
            (b) the Contract Supply Staff agrees to maintain detailed records for at least ninety (90) days in relation
            to money received, the deposit details and copies of relevant receipts, deposit slips, documents and other
            papers for Whizzard and/or the Client.{"\n"}{"\n"}

            2.3. During the course of providing Services, the Contract Supply Staff shall, at it own cost and expense,
            be solely responsible for:{"\n"}
            2.3.1. ensuring safe custody of the Goods received from or on behalf of Whizzard.{"\n"}
            2.3.2. file FIRs and follow-up on police complaints in relation to loss or theft of Goods or other assets of
            Whizzard by the Contract Supply Staff, and provide Whizzard with updates and copies of such FIRs, complaints
            and any orders which may be passed in this regard.{"\n"}
            2.3.3. ensuring the Vehicle is available at all times for the provision of Services.{"\n"}
            2.3.4. transhipment in accordance with Clause 3.2.4.{"\n"}
            2.3.5. periodic self-training and/or attending training sessions organised by Whizzard in relation, but not
            limited to interaction with Clients, the Laws on prevention of sexual harassment, maintaining
            confidentiality of information and non-disclosure, prevention of any offence including theft and hijacking
            of the Vehicle or Goods, and road safety Law.{"\n"}
            2.3.6. the compliance and payments under all applicable labour Laws.{"\n"}
            2.3.7. ensuring it has all necessary that Certificates required, as may be introduced or updated from time
            to time, to render Services under this Agreement and that such Certificates shall remain valid through the
            Term.{"\n"}
            2.3.8. any liability or penalties incurred by it not limited to lawsuits, complaints, compensation, awards,
            fines, challans and the like, arising out of any breach of any Law.{"\n"}
            2.3.9. maintenance charges and the like in relation to the Vehicle and other assets.{"\n"}
            2.3.10. promoting equality of opportunity or treatment in employment in accordance with Law. The Contract
            Supply Staff shall also ensure that it undergoes training to be sensitised and does not discriminate based
            on race, colour, sex, language, religion, political or other opinion, national or social origin, property,
            birth or other status.{"\n"}

            2.4. Whizzard will require the Contract Supply Staff to:{"\n"}
            2.4.1. use a functioning GPS device to track their real-time location;{"\n"}
            2.4.2. download and install the mobile application of Whizzard or the Client as applicable (“App”) on their
            smartphone devices and ensure mobile connectivity in the field.{"\n"}
            2.4.3. communicate and update information in relation to the Services in real time to Whizzard and/or the
            Client, including through the App.{"\n"}
            2.4.4. immediately report the loss, damage or theft of Goods or other assets of Whizzard during the
            provision of Services by the Contract Supply Staff to Whizzard’s authorised representative and participate
            in any internal or official investigation in this regard.{"\n"}{"\n"}

            2.5. Whizzard may require the Contract Supply Staff to:{"\n"}
            2.5.1. provide copies of its bank statement for purposes of audit and verification by Whizzard.{"\n"}
            2.5.2. use a GPS or a smartphone device and related accessories provided by Whizzard. The Contract Supply
            Staff will complete and self-attest the “Asset Declaration Form” confirming receipt of such devices and
            related accessories from Whizzard.{"\n"}
            2.5.3. use Vehicles to provide Services at any point on the designated route at no extra cost.{"\n"}
            2.5.4. make multiple trips in relation to the Services;{"\n"}
            2.5.5. alter the location and nature of its operations temporarily and the Contract Supply Staff agrees to
            such alteration for the timely completion of Services.{"\n"}{"\n"}

            3. PAYMENT: TERMS AND MODALITIES{"\n"}{"\n"}

            3.1. Whizzard will make payment towards provision of Services directly in the Contract Supply Staff’s bank
            account on record in terms of the schedule of rates set forth in Payment Plans for different nature of work
            which may be updated and amended from time to time at Whizzard’s sole discretion and will be communicated to
            the Contract Supply Staff.{"\n"}{"\n"}

            3.2. Without limitation to any other remedy available to Whizzard under this Agreement or Law, Whizzard has
            the right to withhold payment to the Contract Supply Staff and/or the Contract Supply Staff may be
            disentitled to payment under certain circumstances:{"\n"}
            3.2.1. If any Goods or any assets of Whizzard are lost, damaged, or stolen while in the possession of the
            Contract Supply Staff, whether intentionally or otherwise and/or on account of the negligence or otherwise,
            the Contract Supply Staff will be responsible for the loss, and the value of Goods will be deducted from the
            payment due to the Contract Supply Staff.{"\n"}
            3.2.2. In an event of the breakdown of a Vehicle or uninformed absenteeism by the Contract Supply Staff, if
            Whizzard has arranged alternate means to provide Services, charges incurred by Whizzard will be deducted
            from payment owed to the Contract Supply Staff.{"\n"}
            3.2.3. In case of public holidays, government holidays, festivals, strikes, bandhs, or any other event where
            Whizzard is not operational, the Contract Supply Staff will not be paid salary/ lease amount and incentives
            for that day.{"\n"}
            3.2.4. No acceptance or use of Services shall relieve the Contract Supply Staff of its obligations with
            respect to the quantity, quality and specifications with respect to the Services rendered or Contract Supply
            Staff's warranties with respect to such Services. Whizzard may, at its option, require replacement of the
            Goods, withhold payment, or seek a refund of any payment made in advance to the Contract Supply Staff, with
            Contract Supply Staff bearing all costs and risk of loss, including repackaging, shipping and insurance
            costs, as well as any differential cost(s) incurred by Whizzard to procure the Services from another service
            provider.{"\n"}{"\n"}

            3.3. Terms and Conditions of Payment:{"\n"}
            3.3.1. Unless otherwise agreed upon, the Contract Supply Staff will be paid by Whizzard on a monthly basis.
            Whizzard will pay a portion of the payment, determined in its sole discretion, to the Contract Supply Staff
            in advance by the 22nd day of a given month during the Term. Whizzard will pay the balance undisputed amount
            as payment to the Contract Supply Staff for a given month during the Term by 7th day of the following month.
            The dates and schedule of payment is subject to change at Whizzard’s sole discretion.{"\n"}
            3.3.2. Whizzard may, at its sole discretion, share a document with a detailed breakup of the monthly payment
            due to the Contract Supply Staff.{"\n"}
            3.3.3. In the event, the Contract Supply Staff has any concerns or grievance in relation to the amount,
            manner or mode of payment for Services rendered, the Contract Supply Staff must, within twenty-four (24)
            hours of such concern or grievance arising - inform Whizzard with complete details including data to back
            the concerns via a message on WhatsApp +91 82972 97000 or email at help@whizzard.in; and inform Whizzard’s
            authorised representative including but not limited to the local cluster managers and operations
            manager.{"\n"}{"\n"}


            4. INSPECTION AND ACCEPTANCE{"\n"}
            4.1. Whizzard and/or the Client shall be permitted to inspect the Vehicles, the state of the Goods during
            transit and upon delivery, and make appropriate inquiries as to the quality of provision of the Services
            rendered by the Contract Supply Staff, and shall be entitled to reject Services rendered which do not meet
            the requirements of this Agreement and/or applicable Law.{"\n"}{"\n"}

            4.2. Within 24 hours after the completion of the Services, Whizzard and/or the Client shall either accept
            the Services in writing (with the date of such writing deemed to be the acceptance date) or inform the
            Contract Supply Staff in writing that the Services are not in material conformance with the terms of this
            Agreement and the applicable specifications.{"\n"}{"\n"}

            5. INSURANCE{"\n"}
            5.1. The Contract Supply Staff shall procure and maintain, with reputable insurers, minimum insurance and
            insurance amounts protecting Whizzard and the Contract Supply Staff against liability from damages and
            liability from damages to property arising out of Contract Supply Staff’s operations in connection with the
            performance of this Agreement and provision of the Services for itself including:{"\n"}
            5.1.1. Vehicle insurance including commercial Vehicle third party insurance;{"\n"}
            5.1.2. fidelity insurance;{"\n"}
            5.1.3. health and/or medical insurance;{"\n"}
            5.1.4. cargo insurance;{"\n"}
            5.1.5. fire insurance;{"\n"}
            5.1.6. accident insurance.{"\n"}{"\n"}

            5.2. Whizzard, at its option and after prior intimation and acceptance by the Contract Supply Staff, may
            cover the Contract Supply Staff under health and life insurance for their wellbeing. If the Contract Supply
            Staff accepts the offer of such coverage, the premium amount towards such coverage would be deducted from
            the monthly payment due to the Contract Supply Staff. Whizzard will make reasonable efforts to secure the
            best premium rates possible to extend this coverage.{"\n"}{"\n"}

            6. PUBLICITY{"\n"}
            6.1. For the purposes of publicity and promotion of Whizzard, the Contract Supply Staff agrees that it will
            permit the branding of the exteriors of the Vehicle with the logo and/or any other form of branding approved
            by Whizzard.{"\n"}{"\n"}

            6.2. The Contract Supply Staff understands and undertakes to secure the necessary permissions from the Road
            Transport Organisation or any other competent authority in the relevant geographical location for such
            branding of the Vehicle, and provide a copy of such permit to Whizzard for its records.{"\n"}{"\n"}

            6.3. Whizzard agrees to provide the artwork and brand the Vehicle at its cost. Whizzard further agrees to
            reimburse the Contract Supply Staff for any expenses incurred in securing such permit against a bill at
            actuals.{"\n"}{"\n"}

            7. For the avoidance of doubt, it is clarified that:{"\n"}
            7.1. any capitalized terms not defined in this Schedule A will be as defined in the Agreement.{"\n"}
            7.2. the terms of this Schedule A are intended to supplement the terms of the Agreement. In the event of any
            contradiction between the terms of this Schedule A and the terms of the Agreement, the Order of Precedence
            as specified in the Clause 17.4 of the Agreement will apply.{"\n"}{"\n"}


            Accepted by Contract Supply Staff:{"\n"}{"\n"}

            NAME: __________________________________{"\n"}{"\n"}

            DATE: ___________________________________{"\n"}{"\n"}
        </Text>
    )
};

const styles = StyleSheet.create({
    shadow: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
        marginLeft: 5,
        marginRight: 5
    },
});

export default new Services();


