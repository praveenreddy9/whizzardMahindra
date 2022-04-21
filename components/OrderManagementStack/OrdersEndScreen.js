import React from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Linking,
    Modal,
    PermissionsAndroid,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {CSpinner, CText, LoadSVG, Styles} from '../common'
import Utils from "../common/Utils";
import Config from "../common/Config";
import Services from "../common/Services";
import {Appbar, DefaultTheme, RadioButton,Checkbox} from "react-native-paper";
import OfflineNotice from '../common/OfflineNotice';
import OneSignal from "react-native-onesignal";
import HomeScreen from "../HomeScreen";
import _ from "lodash";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
// import SwipeButton from "rn-swipe-button";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import Geolocation from "react-native-geolocation-service";
import RNAndroidLocationEnabler from "react-native-android-location-enabler";
// import {CheckBox} from "react-native-elements";
import {Column as Col, Row} from "react-native-flexbox-grid";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import ImageZoom from "react-native-image-pan-zoom";


const options = {
    title: 'Select Avatar',
    // customButtons: [{name: 'fb', title: 'Choose Photo from Facebook'}],
    storageOptions: {
        skipBackup: true,
        path: 'images',
    },
    maxWidth: 1200, maxHeight: 800,
};

const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};
const winW = Dimensions.get('window').width;
const winH = Dimensions.get('window').height;
export default class OrdersEndScreen extends React.Component {

    constructor(props) {
        super(props);
        // this.requestLocationPermission()
        this.props.navigation.addListener(
            'didFocus', () => {
                OneSignal.addEventListener('received', HomeScreen.prototype.onReceived);
                OneSignal.addEventListener('opened', HomeScreen.prototype.onOpened.bind(this));
            }
        );
        this.props.navigation.addListener(
            'willBlur', () => {
                OneSignal.removeEventListener('received', HomeScreen.prototype.onReceived);
                OneSignal.removeEventListener('opened', HomeScreen.prototype.onOpened.bind(this));
            }
        );
        this.state = {
            spinnerBool: false,
            orderData: [],
            cashCollected: '',
            OrderNotDeliveredReasonsList: [{reason: 'Customer not available', value: '1', status: 'ATTEMPTED'},
                // {reason: 'Cutomer not accepting orders', value: '2', status: 'REJECTED'},
                {reason: 'Address not reachable', value: '3', status: 'ATTEMPTED'},
                {reason: 'Others', value: '4', status: 'ATTEMPTED'}],
            currentLocation: [],
            // latitude: null,
            // longitude: null,
            GPSasked: false, swipeActivated: false, picUploaded: false, ImageData: '', ImageFormData: '',
            showOrderItemsList: true,
            itemIds: [],
            selectedItemId: false,
            status: '',
            buttonSwiped: false, cashCheck: false,orderConfirmModal:false,orderConfirmed:false,finalList:[],
            imagePreview: false, imagePreviewURL: '',imageRotate:'0',
            imageSelectionModal:false
        };
    }

    componentDidMount() {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            // this.requestCameraPermission()
            this.requestLocationPermission();
            let tempData = self.props.navigation.state.params.orderData
            self.setState({
                orderData: tempData,
                orderAmount: tempData.orderTotal,
                cashCollected: tempData.paymentType === "COD" ? '' : JSON.stringify(tempData.payment.amount_ordered),
                cashCheck: tempData.paymentType === "COD" ? false : true,
                shiftId: self.props.navigation.state.params.shiftId,
            }, () => {
                // console.log('end order data',tempData);
                const updatedData = [];
                const tempList = tempData.orderItems;
                for (let i = 0; i < tempList.length; i++) {
                    let tempPos = tempList[i]
                    tempPos.selectedItemId = false
                    tempPos.delivered = tempList[i].remainingQuantity ? tempList[i].remainingQuantity: tempList[i].deliveredQuantity
                    tempPos.rejected = tempList[i].rejectedQuantity
                    updatedData.push(tempPos)
                }
                if (tempList.length === 0) {
                    self.setState({showOrderItemsList:false})
                }
                self.setState({orderItems: updatedData})
            })
            // Services.checkMockLocationPermission((response) => {
            //     if (response){
            //         this.props.navigation.navigate('Login')
            //     }
            // })
        });
    }


    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    errorHandling(error) {
        // console.log("error", error, error.response);
        const self = this;
        if (error.response) {
            if (error.response.status === 403) {
                self.setState({spinnerBool: false});
                Utils.dialogBox("Token Expired,Please Login Again", '');
                self.props.navigation.navigate('Login');
            } else if (error.response.status === 500) {
                self.setState({spinnerBool: false});
                if (error.response.data.message) {
                    Utils.dialogBox(error.response.data.message, '');
                } else {
                    Utils.dialogBox(error.response.data[0], '');
                }
            } else if (error.response.status === 400) {
                self.setState({spinnerBool: false});
                if (error.response.data.message) {
                    Utils.dialogBox(error.response.data.message, '');
                } else {
                    Utils.dialogBox(error.response.data[0], '');
                }
            } else if (error.response.status === 413) {
                self.setState({spinnerBool: false}, () => {
                    Utils.dialogBox('Request Entity Too Large', '');
                })
            } else if (error.response.status === 404) {
                self.setState({spinnerBool: false}, () => {
                    Utils.dialogBox(error.response.data.error, '');
                })
            } else {
                self.setState({spinnerBool: false});
                Utils.dialogBox("Error loading Shift Data, Please contact Administrator ", '');
            }
        } else {
            self.setState({spinnerBool: false});
            Utils.dialogBox(error.message, '');
        }
    }

    async requestCameraPermission() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                await this.requestLocationPermission();
            } else {
                Utils.dialogBox('Camera permission denied', '');
                this.props.navigation.goBack();
            }
        } catch (err) {
            Utils.dialogBox('err', '');
            console.warn(err);
        }
    }

    requestLocationPermission = async()=> {
        // this.getCurrentLocation()
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                await Geolocation.getCurrentPosition(
                    (position) => {
                        const currentLocation = position.coords;
                        this.setState({
                            currentLocation: currentLocation,
                            latitude: currentLocation.latitude,
                            longitude: currentLocation.longitude,
                        }, function () {
                            if (currentLocation.latitude === null && currentLocation.longitude === null) {
                                this.state.GPSasked === true
                                    ?
                                    Alert.alert('', 'Your Location data is missing, Please clear cache in GOOGLE MAPS',
                                        [{
                                            text: 'GO BACK', onPress: () => {
                                                this.props.navigation.goBack()
                                            }
                                        }])
                                    :
                                    Alert.alert('', 'Your Location data is missing, Please check your GPS  Settings',
                                        [
                                            {
                                                text: 'ASK GPS', onPress: () => {
                                                    this.checkGPSpermission();
                                                }
                                            },
                                            {
                                                text: 'GO BACK', onPress: () => {
                                                    this.props.navigation.goBack()
                                                }
                                            }
                                        ]
                                    )
                            } else if (currentLocation.latitude && currentLocation.longitude && this.state.swipeActivated === true) {
                                this.validatingLocation()
                            }
                        });
                    },
                    (error) => {
                        // console.log(error.code, error.message);
                        if (error.code === 2 && this.state.latitude === null && this.state.longitude === null) {
                            Alert.alert('', 'Your Location data is missing, Please check your GPS  Settings',
                                [
                                    {
                                        text: 'ASK GPS', onPress: () => {
                                            this.checkGPSpermission();
                                        }
                                    },
                                    {
                                        text: 'GO BACK', onPress: () => {
                                            this.props.navigation.goBack()
                                        }
                                    }
                                ]
                            )
                            // this.checkGPSpermission();
                        } else {
                            // console.log('GPS error ',error.code, error.message);
                            Utils.dialogBox(error.message, '')
                            this.props.navigation.goBack()
                        }
                    },
                    // {enableHighAccuracy: false, timeout: 10000, maximumAge: 100000}
                    {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
                );
            } else {
                Utils.dialogBox('Location permission denied', '');
                this.setState({latitude: null, longitude: null})
                this.props.navigation.goBack();
            }
        } catch (err) {
            // console.log('location error before',err);
            this.setState({latitude: null, longitude: null})
        }
    }

    checkGPSpermission() {
        RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({interval: 10000, fastInterval: 5000})
            .then(data => {
                this.setState({GPSasked: true}, () => {
                    this.requestLocationPermission()
                })
            }).catch(err => {
            Utils.dialogBox('GPS permissions denied', '');
            this.props.navigation.goBack()
        });
    }


    validatingLocation() {
        Services.returnCurrentPosition((position)=>{
            const latitude = position.latitude;
            const longitude = position.longitude;

        if (latitude && longitude) {
            let tempBody = {}
            const latitude = this.state.latitude;
            const longitude = this.state.longitude;
            tempBody.location = {"latitude": latitude, "longitude": longitude}
             if (this.state.swipeActivated) {
                if (this.state.Button === 'ATTEMPTED'){
                    this.CancelOrder(tempBody)
                }else {
                    this.setState({
                        latitude: position.latitude,
                        longitude: position.longitude,
                    },()=>{
                        if (this.state.selectedButton === 'DELIVER'){
                            if (this.state.orderItems.length > 0) {
                                if (this.state.itemIds.length > 0) {
                                    this.endOrder()
                                } else {
                                    Utils.dialogBox('Please select the delivery items', '')
                                }
                            } else {
                                this.endOrder()
                            }
                        }else if (this.state.selectedButton === 'REJECT') {
                            if (this.state.orderItems.length > 0) {
                                if (this.state.itemIds.length > 0) {
                                    this.rejectOrderByCustomer()
                                } else {
                                    Utils.dialogBox('Please select atleast one item for rejection', '')
                                }
                            } else {
                                this.rejectOrderByCustomer()
                            }
                        }
                    })

                }
            }
        }else {
            // this.requestLocationPermission();
            Alert.alert('', 'Your Location data is missing,Please check your Location Settings',
                [{
                    text: 'enable', onPress: () => {
                        this.requestLocationPermission();
                    }
                }]);
        }
        })
    }


    //API CALL to END ORDER
    endOrder = () => {
        const self = this;
        const latitude = this.state.latitude;
        const longitude = this.state.longitude;
        let itemIds = this.state.orderItems.length > 0 ? this.state.itemIds : null;

        const apiURL = Config.routes.BASE_URL + Config.routes.END_ORDER;


        let tempIds = this.state.itemIds
        let orderItems = this.state.orderItems
        // console.log('api orderItems',orderItems);
        // console.log('api tempIds',tempIds);
        let tempList = []
        let finalList = []
        let tempValuesList = []
        let unSelectedCount = []

        let sampleList =[]
        // console.log('orderItems start',orderItems);

        for (let i = 0; i < orderItems.length; i++) {
            let sampleOrders = orderItems[i]
            if (orderItems[i].selectedItemId === true) {

                let tempData = orderItems[i]
                tempData.count = tempData.delivered
                finalList.push(tempData)


                sampleOrders.tempRejected = sampleOrders.rejected
                sampleOrders.tempDelivered = sampleOrders.delivered
                sampleList.push(sampleOrders)

                let tempCount =  tempData.delivered
                if (tempCount === 0 || tempCount === null ){
                    tempValuesList.push(tempCount)
                }
            }else {
                // sampleOrders.tempRejected = sampleOrders.delivered
                // sampleOrders.tempDelivered = sampleOrders.rejected
                sampleOrders.tempRejected = sampleOrders.itemQuantity
                sampleOrders.tempDelivered = 0
                sampleList.push(sampleOrders)
                if (sampleOrders.delivered !== sampleOrders.itemQuantity){
                    unSelectedCount.push(sampleOrders.delivered)
                }
            }
            }


        // console.log('sampleList last',sampleList);
        let finalValuesList = tempValuesList.length
        let unSelectedLength = unSelectedCount.length

        // console.log('unSelectedLength',unSelectedLength,'unSelectedCount==',unSelectedCount);

        if (finalValuesList === 0) {
        if (unSelectedLength === 0) {

            if (this.state.orderItems.length > 0) {
                if (this.state.itemIds.length > 0) {
                    this.setState({orderConfirmModal:!this.state.orderConfirmed,finalList:sampleList,selectedButton:'DELIVER'})
                } else {
                    Utils.dialogBox('Please select the delivery items', '')
                }
            }else {
                this.setState({orderConfirmModal:!this.state.orderConfirmed,finalList:[],selectedButton:'DELIVER'})
            }


            let tempBody = {}
            tempBody.location = {latitude: latitude, longitude: longitude}
            tempBody.id = this.state.orderData.id
            tempBody.shiftId = this.state.shiftId
            tempBody.items = finalList;
            if (this.state.orderData.paymentType === 'COD'){
                tempBody.cashCollected = Math.ceil(this.state.cashCollected)
            }
            const body = tempBody
            // console.log('Delivered apiurl', apiURL,'body==',body)
            if (this.state.orderConfirmed) {
                self.setState({spinnerBool: true}, () => {
                    Services.AuthHTTPRequest(apiURL, "POST", body, function (response) {
                        if (response.status === 200) {
                            self.setState({spinnerBool: false, swipeActivated: false,orderConfirmed:false})
                            self.props.navigation.goBack()
                        }
                    }, function (error) {
                        // console.log(' end Order eror', error)
                        self.setState({ swipeActivated: false, orderConfirmed: false})
                        self.errorHandling(error);
                    })
                });
            }
        }else {
            Utils.dialogBox('Un-checked Item count should not be edited', '')
        }
        }else {
            Utils.dialogBox('Selected Item Delivered count should not be 0', '')
        }
    };

    rejectOrderByCustomer = () => {
        // if(this.state.itemIds.length > 0) {

        const self = this;
        const latitude = this.state.latitude;
        const longitude = this.state.longitude;
        let itemIds = this.state.orderItems.length > 0 ? this.state.itemIds : null;
        const apiURL = Config.routes.BASE_URL + Config.routes.REJECT_ORDER_BY_CUSTOMER;

        let tempIds = this.state.itemIds
        let orderItems = this.state.orderItems
        // console.log('reject orderItems',orderItems);
        // console.log('api tempIds',tempIds);
        let tempList = []
        let finalList = []
        let tempValuesList = []
        let finalValuescheck = []
        let imageCountCheck = []
        let unSelectedCount = []

        let sampleList = []

        for (let i = 0; i < orderItems.length; i++) {
            let sampleOrders = orderItems[i]
                if (orderItems[i].selectedItemId === true) {
                    let tempData = orderItems[i]
                    tempData.count = tempData.delivered
                    finalList.push(tempData)


                    sampleOrders.tempRejected = orderItems[i].delivered
                    sampleOrders.tempDelivered = orderItems[i].rejected
                    sampleList.push(sampleOrders)

                    let tempCount =  tempData.delivered
                    if (tempCount === 0 || tempCount === null ){
                        finalValuescheck.push(tempCount)
                    }
                    if (sampleOrders.rejected > 0){
                        imageCountCheck.push(sampleOrders.rejected)
                    }
                } else {
                    // sampleOrders.tempRejected = sampleOrders.rejected
                    // sampleOrders.tempDelivered = sampleOrders.delivered
                    // sampleList.push(sampleOrders)
                    sampleOrders.tempRejected = 0
                    sampleOrders.tempDelivered = sampleOrders.itemQuantity
                    sampleList.push(sampleOrders)
                    if (sampleOrders.delivered !== sampleOrders.itemQuantity){
                        unSelectedCount.push(sampleOrders.delivered)
                    }
                    if (sampleOrders.delivered > 0){
                        imageCountCheck.push(sampleOrders.delivered)
                    }
                }
        }


        let finalImage = true
        if (imageCountCheck.length > 0){
            finalImage = !!this.state.picUploaded;
        }else {
            finalImage = true
        }

        let finalValuescheckLength = finalValuescheck.length
        let unSelectedLength = unSelectedCount.length

        // console.log('unSelectedLength reject',unSelectedLength,'unSelectedCount==',unSelectedCount);


        let finalCash = 0;
        if (finalImage){
            let totalCash = this.state.orderData.payment.amount_ordered
            finalCash = totalCash- this.state.cashCollected
        }else {
            finalCash = 0;
        }



        // console.log('finalCash',finalCash);

        // console.log('rejected finalValuesList',finalValuesList,'tempValuesList===',tempValuesList);
        // console.log('rejected finalImage',finalImage);
        if (finalImage) {
            if (finalValuescheckLength === 0) {
            if (unSelectedLength === 0) {
                if (this.state.orderItems.length > 0) {
                    if (this.state.itemIds.length > 0) {
                        this.setState({
                            orderConfirmModal: !this.state.orderConfirmed,
                            finalList: sampleList,
                            selectedButton: 'REJECT'
                        })
                    } else {
                        Utils.dialogBox('Please select the rejected items', '')
                    }
                } else {
                    this.setState({
                        orderConfirmModal: !this.state.orderConfirmed,
                        finalList: [],
                        selectedButton: 'REJECT'
                    })
                }


                let tempBody = {}
                tempBody.location = {latitude: latitude, longitude: longitude}
                tempBody.id = this.state.orderData.id
                tempBody.cashCollected = finalCash
                tempBody.shiftId = this.state.shiftId
                tempBody.items = finalList;

                const body = tempBody
                if (this.state.orderConfirmed) {
                    self.setState({spinnerBool: true}, () => {
                        Services.AuthHTTPRequest(apiURL, "POST", body, function (response) {
                            if (response.status === 200) {
                                // console.log('reject OrderBy Customer====', response.data);
                                self.setState({spinnerBool: false, swipeActivated: false, orderConfirmed: false})
                                self.props.navigation.goBack()
                            }
                        }, function (error) {
                            self.setState({ swipeActivated: false, orderConfirmed: false})
                            self.errorHandling(error);
                        })
                    });
                }
            } else {
                Utils.dialogBox('Un-checked Item count should not be edited', '')
            }
            } else {
                Utils.dialogBox('Selected Item Rejected count should not be 0', '')
            }
        }else {
            Utils.dialogBox('Please upload Image of delivered item','')
        }
    }


    //cashCollected validate
    CashCollectedValidate(cash) {
        cash = cash.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_='":*?<>{}]/g, '').replace(/\s+/g, '');

        if (cash > 3000000) {
            this.setState({cashCollected: '3000000'})
            Utils.dialogBox('Maximum Value is 300000', '');
        } else if (cash < 0) {
            this.setState({cashCollected: '0'})
            // Utils.dialogBox('Minimum Value is 0', '');
        } else {
            this.setState({cashCollected: cash}, () => {
                if (this.state.orderItems.length > 0) {
                    this.setState({cashCheck: true})
                } else {
                    if (this.state.cashCollected === JSON.stringify(this.state.orderData.payment.amount_ordered)) {
                        this.setState({cashCheck: true})
                    } else {
                        this.setState({cashCheck: false})
                    }
                }
            })
        }
    }

    //Uploadig DELIVERED ORDER PIC
    deliveredOrderUpload(uploadType) {
        const self = this;
        Services.checkImageUploadPermissions(uploadType, (response) => {
            // console.log('service image retunr', response);
            let image = response.image
            let formData = response.formData
            let userImageUrl = image.path

                    let apiURL = Config.routes.BASE_URL + Config.routes.DELIVERED_IMAGE_UPLOAD + self.state.orderData.id;
                    const body = formData;
                    // console.log(' image upload url', apiURL, 'body===', body)
                    this.setState({spinnerBool: true}, () => {
                        Services.AuthProfileHTTPRequest(apiURL, 'POST', body, function (response) {
                            if (response.status === 200) {
                                // console.log('image upload resp200',response)
                                self.setState({ImageData: image, spinnerBool: false, picUploaded: true, ImageFormData: formData,imageLoading:true})
                            }
                        }, function (error) {
                            // console.log("delivered img error", error.response, error);
                            self.errorHandling(error)
                        });
                    });
        })
    };

    validateCancelShiftReason() {
        if (this.state.cancelReasonValue) {
            if (this.state.cancelReasonValue === '4') {
                if (this.state.otherReasontoCancel) {
                    this.setState({CancelShiftReason: this.state.otherReasontoCancel,Button:'ATTEMPTED',swipeActivated:true},()=>{
                        this.validatingLocation()
                    })
                } else {
                    Utils.dialogBox('Please enter other Reason for Not Delivering the Order', '')
                }

            } else {
                this.setState({Button:'ATTEMPTED',swipeActivated:true},()=>{
                    this.validatingLocation()
                })
            }
        } else {
            // console.log('CancelShiftReason', this.state.CancelShiftReason, this.state.orderStatus);
            Utils.dialogBox('Please select the Reason for Not Delivering the Order', '')
        }
    }


    //API CALL to CANCEL ORDER
    CancelOrder(body) {
        const self = this;
        const orderId = self.state.orderData.id;
        // const apiURL = Config.routes.BASE_URL + Config.routes.CANCEL_ORDER + '?id=' + orderId + '&reason=' + this.state.CancelShiftReason + '&status=' + this.state.orderStatus;
        const apiURL = Config.routes.BASE_URL + Config.routes.CANCEL_ORDER;
        body.id = self.state.orderData.id
        body.reason = self.state.CancelShiftReason
        body.status = self.state.orderStatus
        // console.log('Cancel Order apiURL====', apiURL,'body==',body);
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "PUT", body, function (response) {
                if (response.status === 200) {
                    // console.log('Cancel Order rep200====', response.data);
                    self.setState({spinnerBool: false, swipeActivated: false})
                    self.props.navigation.goBack()
                }
            }, function (error) {
                // console.log(' Cancel Order eror', error)
                self.errorHandling(error);
            })
        });
    };

    //API CALL to Send Traking Link
    sendTrackingLink() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.SEND_TRACKING_LINK + '?shiftId='+self.state.shiftId+ '&orderId='+ self.state.orderData.id;
        const body ={};
        // console.log('tracking link apiURL====', apiURL,'body==',body);
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, function (response) {
                if (response.status === 200) {
                    // console.log('tracking link rep200====', response.data);
                    self.setState({spinnerBool: false, swipeActivated: false},()=>{
                        Alert.alert('Tracking Link has been sent to Mobile Number',Alert);
                    })
                }
            }, function (error) {
                self.errorHandling(error);
            })
        });
    };

    validateTotalCashCollected(itemId,selectedCount,price, totalCount, itemStatus, button) {
        const listOfItems = this.state.orderItems;
        const num = this.state.cashCollected;
        // let oldCash = 0;
        // if (num === '' || num === '0') {
        //     oldCash = 0;
        // } else {
        //     oldCash = parseInt(this.state.cashCollected);
        // }

let tempTotal = []
        for (let i = 0; i < listOfItems.length; i++) {
            if (listOfItems[i].selectedItemId=== true){
                if (listOfItems[i].id===itemId) {
                }else {
                    let tempAmount = listOfItems[i].delivered * listOfItems[i].itemPricePerEach;
                    tempTotal.push(tempAmount);
                }
            }
        }

        let oldCash =tempTotal.reduce(function (a, b) {
            return a + b;
        }, 0)

        let calculatedAmount = selectedCount*price
        // let calculatedAmount = 0
        // if (button === 'decrement') {
        //     calculatedAmount = (selectedCount -1) *price;
        // }else {
        //     calculatedAmount = (selectedCount+1)*price;
        // }
        // console.log('calculatedAmount',calculatedAmount,'selectedCount==',selectedCount,'price=',price);


        if (itemStatus === true) {
            // let temCashCollected = Math.ceil(oldCash + calculatedAmount)
            let temCashCollected = oldCash + calculatedAmount
           let finalCash = Math.round(temCashCollected)
            this.setState({cashCollected: JSON.stringify(finalCash)})
        } else {
            if (button === 'checkBox') {
                // const temCashCollected = Math.ceil(oldCash);
                let temCashCollected = oldCash
               let finalCash = Math.round(temCashCollected)
                this.setState({cashCollected: JSON.stringify(finalCash)})
            }
        }

        if (itemId && button === 'checkBox') {
            if (itemStatus === true) {
                for (let i = 0; i < listOfItems.length; i++) {
                    if (itemStatus === listOfItems[i].selectedItemId && itemId === listOfItems[i].id) {
                        this.state.itemIds.push(itemId);
                    }
                }
            } else {
                    this.state.itemIds.pop(itemId);
            }
        }


        // if (itemId && calculatedAmount) {
        //     if (itemStatus === true) {
        //         const temCashCollected = oldCash + calculatedAmount;
        //         this.setState({cashCollected: JSON.stringify(temCashCollected)})
        //         for (let i = 0; i < listOfItems.length; i++) {
        //             if (itemStatus === listOfItems[i].selectedItemId && itemId === listOfItems[i].id) {
        //                 this.state.itemIds.push(itemId);
        //             }
        //         }
        //     } else {
        //         if (button === 'checkBox'){
        //             this.state.itemIds.pop(itemId);
        //             const temCashCollected = oldCash - calculatedAmount;
        //             this.setState({cashCollected: JSON.stringify(temCashCollected)})
        //         }
        //     }
        // } else {
        //     Utils.dialogBox('Item ID not Available..!', '');
        // }

        if (this.state.itemIds.length === this.state.orderItems.length) {
            Utils.dialogBox('Please cancel the Order')
        }

    }

    validateCount(item, index) {
        return (
            <View style={[Styles.row,Styles.alignCenter]}>
                <TouchableOpacity
                    style={[Styles.aslCenter]}
                    disabled={ !item.selectedItemId ||  item.remainingQuantity === item.rejected}
                    onPress={() => this.operatorValidation(item, index, 'DECREMENT')}
                >
                    <Text style={[Styles.IncrementButton, !item.selectedItemId || item.remainingQuantity === item.rejected ?Styles.bcAsh:Styles.bcBlk,
                        !item.selectedItemId || item.remainingQuantity === item.rejected ?Styles.cAsh:Styles.cBlk]}>-</Text></TouchableOpacity>
                <Text style={[Styles.txtAlignCen, Styles.ffMbold, Styles.f14, {width: 35}]}>{item.delivered}</Text>
                <TouchableOpacity style={[Styles.aslCenter,]}
                                  disabled={!item.selectedItemId || item.delivered === item.remainingQuantity}
                                  onPress={() => this.operatorValidation(item, index, 'INCREMENT')}>
                    <Text style={[Styles.IncrementButton,!item.selectedItemId || item.delivered === item.remainingQuantity ?Styles.bcAsh:Styles.bcBlk,
                        !item.selectedItemId ||  item.delivered === item.remainingQuantity ?Styles.cAsh:Styles.cBlk]}>+</Text></TouchableOpacity>
            </View>
        )
    }

    operatorValidation(item, index, operator) {
        if (operator === 'DECREMENT') {
            let value = Math.trunc(parseInt(item.delivered));
            if (item.count === '') {
                Utils.dialogBox('Please enter a value', '');
            } else {
                let value = Math.trunc(parseInt(item.delivered));
                if (value < 1) {
                    Utils.dialogBox('Minimum value is 0', '');
                } else {
                    let tempCount = (Math.trunc(Number(item.delivered) - 1));
                    let orderItems = [...this.state.orderItems]
                    orderItems[index] = {
                        ...orderItems[index],
                        delivered: tempCount,
                        rejected:item.rejected + 1
                    }
                    this.setState({orderItems})
                    this.validateTotalCashCollected(item.id, tempCount,item.itemPricePerEach,item.delivered, item.selectedItemId, 'decrement')
                }
            }
        } else if (operator === 'INCREMENT') {
            let value = Math.trunc(parseInt(item.delivered));
            let TargetValue = Math.trunc(parseInt(item.remainingQuantity));
            if (value > TargetValue) {
                Utils.dialogBox('Maximum value is ' + TargetValue, '');
            } else {
                let tempCount = (Math.trunc(Number(item.delivered) + 1));
                let orderItems = [...this.state.orderItems]
                orderItems[index] = {
                    ...orderItems[index],
                    delivered: tempCount,
                    rejected:item.rejected-1
                }
                this.setState({orderItems})
                this.validateTotalCashCollected(item.id,tempCount, item.itemPricePerEach,item.delivered, item.selectedItemId, 'increment')
            }

        }
    }

    rotate(){
        let newRotation = JSON.parse(this.state.imageRotate) + 90;
        if(newRotation >= 360){
            newRotation =- 360;
        }
        this.setState({
            imageRotate: JSON.stringify(newRotation),
        })
    }

    render() {
        const {orderData} = this.state;
        return (
            <View style={[[Styles.flex1, Styles.bgDWhite]]}>
                {this.renderSpinner()}
                <OfflineNotice/>
                {
                    this.state.orderData
                        ?
                        <View style={[[Styles.flex1, Styles.bgDWhite]]}>

                            <View style={[Styles.bgDarkRed, Styles.AuthScreenHeadershadow]}>
                                <Appbar.Header theme={theme} style={Styles.bgDarkRed}>
                                    <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                                    <Appbar.Content
                                        title={orderData.siteCode ? orderData.siteCode + ' - ': '' + this.state.orderData.orderId}
                                        titleStyle={[Styles.ffMbold]}/>
                                    {/*<Appbar.Action icon="phone" size={25} />*/}
                                </Appbar.Header>
                            </View>

                            {/*<View>*/}
                            {/*    <View style={[Styles.ordersStatusPositionAbs]}>*/}
                            {/*    </View>*/}
                            {/*    <View style={[Styles.row, Styles.p15, Styles.jSpaceBet,]}>*/}
                            {/*        <View>*/}
                            {/*            <MaterialIcons name="timer" size={30} color="green"*/}
                            {/*                           style={[Styles.aslCenter, Styles.p5, Styles.bgDash]}/>*/}
                            {/*            <Text>Accepted</Text>*/}
                            {/*        </View>*/}
                            {/*        <View style={[Styles.aslCenter]}>*/}
                            {/*            <MaterialIcons name="timer" size={30} color="green"*/}
                            {/*                           style={[Styles.aslCenter, Styles.p5, Styles.bgDash]}/>*/}
                            {/*            <Text>Arriving</Text>*/}
                            {/*        </View>*/}
                            {/*        <View pointerEvents="none">*/}
                            {/*            <MaterialIcons name="timer" size={30} color="#b2beb5"*/}
                            {/*                           style={[Styles.aslCenter, Styles.p5, Styles.bgDash]}/>*/}
                            {/*            <Text>Delivered</Text>*/}
                            {/*        </View>*/}
                            {/*    </View>*/}
                            {/*</View>*/}

                            {
                                orderData
                                    ?
                                    <ScrollView
                                        persistentScrollbar={true}
                                        style={[Styles.flex1, Styles.bgDWhite, Styles.padH5]}>

                                        <View style={[Styles.p5]}>
                                            <View style={[Styles.row, Styles.jSpaceBet]}>
                                                <Text style={[Styles.f16, Styles.ffMbold,]}>Order Details
                                                    : {orderData.itemQuantity} Items</Text>
                                                <MaterialIcons
                                                    name={this.state.showOrderItemsList ? 'expand-less' : 'expand-more'}
                                                    color='#000' size={30}
                                                    onPress={() => {
                                                        this.setState({showOrderItemsList: !this.state.showOrderItemsList})
                                                    }}/>
                                            </View>

                                            {
                                                this.state.orderItems && this.state.showOrderItemsList
                                                    ?
                                                    <View style={{flex: 1, alignItems: 'center'}}>
                                                        <Row size={12} nowrap
                                                             style={[Styles.row, Styles.padV10, Styles.alignCenter, Styles.bgOrangeYellow]}>
                                                            <Col sm={4.5}>
                                                                <Text
                                                                    style={[Styles.ffMbold, Styles.f16, Styles.aslCenter]}>Item</Text>
                                                            </Col>
                                                            <Col sm={2}>
                                                                <Text
                                                                    style={[Styles.ffMbold, Styles.f16, Styles.aslCenter]}>Price(<FontAwesome
                                                                    name="inr" size={14} color="#000"/>)</Text>
                                                            </Col>
                                                            <Col sm={3.5}>
                                                                <Text
                                                                    style={[Styles.ffMbold, Styles.f16, Styles.aslCenter]}>Count</Text>
                                                            </Col>
                                                            <Col sm={2}>
                                                                <Text style={[Styles.ffMbold, Styles.f16]}/>
                                                            </Col>
                                                        </Row>
                                                        <View style={[Styles.row, Styles.aslCenter, Styles.flex1]}>
                                                            {
                                                                this.state.orderItems.length > 0 ?
                                                                    <FlatList
                                                                        data={this.state.orderItems}
                                                                        renderItem={({item, index}) => (

                                                                            <Row size={12} nowrap
                                                                                 style={[Styles.row, Styles.p5, Styles.aslCenter, {
                                                                                     // backgroundColor: ((index % 2) === 0 ? '#f5f5f5' : '#fff')
                                                                                     backgroundColor: ((index % 2) === 0 ? '#ccf6d8' : '#e4b7d4')
                                                                                 }
                                                                                 ]}>
                                                                                <Col sm={4.5}>
                                                                                    <Text
                                                                                        style={[Styles.ffMregular, Styles.f14, {textAlignVertical: 'center'}]}>{_.startCase(item.name) || '---'}</Text>
                                                                                </Col>
                                                                                <Col sm={2}>
                                                                                    <Text
                                                                                        style={[Styles.ffMbold, Styles.f14, Styles.aslCenter]}>{item.price}({item.itemQuantity})</Text>
                                                                                </Col>
                                                                                <Col sm={3.5}>
                                                                                    {
                                                                                        item.status === 'DELIVERED' || item.status === 'REJECTED' || item.status === "REJECTED_BY_DA"
                                                                                            ?
                                                                                            <Text
                                                                                                style={[Styles.ffMregular, Styles.f14, Styles.aslCenter]}>{item.delivered}</Text>
                                                                                            :
                                                                                            item.status == null || item.remainingQuantity !== 0
                                                                                                ?
                                                                                                this.validateCount(item, index)
                                                                                                :
                                                                                                <Text
                                                                                                    style={[Styles.ffMregular, Styles.f14, Styles.aslCenter]}>{item.delivered}</Text>
                                                                                    }
                                                                                </Col>
                                                                                <Col sm={2}>
                                                                                    <View>
                                                                                        {item.status === 'DELIVERED' || item.status === 'REJECTED' || item.status === "REJECTED_BY_DA"
                                                                                            ?
                                                                                            null
                                                                                            :
                                                                                            item.status === null || item.remainingQuantity !== 0
                                                                                                ?
                                                                                                <View>
                                                                                                    <Checkbox
                                                                                                        color={'#000'}
                                                                                                        size={25}
                                                                                                        onPress={() => {
                                                                                                            let orderItems = [...this.state.orderItems]
                                                                                                            orderItems[index] = {
                                                                                                                ...orderItems[index],
                                                                                                                selectedItemId: !item.selectedItemId,
                                                                                                                delivered: item.itemQuantity,
                                                                                                                rejected: 0
                                                                                                            }
                                                                                                            this.setState({orderItems}, () => {
                                                                                                                let tempAmount = item.count * item.itemPricePerEach;
                                                                                                                let tempCount = item.delivered
                                                                                                                this.validateTotalCashCollected(item.id, tempCount, item.itemPricePerEach, item.count, !item.selectedItemId, 'checkBox')
                                                                                                            })
                                                                                                        }}
                                                                                                        status={item.selectedItemId ? 'checked' : 'unchecked'}
                                                                                                    />
                                                                                                </View>
                                                                                                : null
                                                                                        }
                                                                                        {
                                                                                            item.status
                                                                                                ?
                                                                                                <Text
                                                                                                    style={[Styles.ffMregular,
                                                                                                        item.status === 'DELIVERED' || item.status === "PARTIALLY_DELIVERED" ? Styles.colorGreen :
                                                                                                            item.status === 'ATTEMPTED' ? [Styles.f12, Styles.cBlueGreenMix] :
                                                                                                                item.status === 'REJECTED' || item.status === 'REJECTED_BY_DA' || item.status === 'REJECTED_BY_CUSTOMER' || item.status === 'CANCELLED' ? Styles.cRed : Styles.cBlk]}>{Services.getOrderItemStatus(item.status)}</Text>
                                                                                                :
                                                                                                null
                                                                                        }
                                                                                    </View>
                                                                                </Col>
                                                                            </Row>
                                                                        )}
                                                                        keyExtractor={(item, index) => index.toString()}
                                                                    />
                                                                    :
                                                                    <Text
                                                                        style={[Styles.cBlk, Styles.f20, Styles.aslCenter, Styles.ffMregular]}>
                                                                        No Items in the list.</Text>
                                                            }
                                                        </View>
                                                    </View>

                                                    :
                                                    null
                                            }

                                            <View style={{borderBottomWidth: 1, paddingVertical: 10}}/>
                                        </View>

                                        {
                                            orderData.showTrackingLink
                                                ?
                                                <View style={[Styles.row, Styles.jEnd, Styles.marV5, Styles.padH10]}>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            this.sendTrackingLink()
                                                        }}
                                                        activeOpacity={0.7}
                                                        style={[Styles.row, Styles.bgLYellow, Styles.br5, Styles.aslCenter, Styles.p5, {width: Dimensions.get('window').width / 2.3}]}>
                                                        {LoadSVG.emailGreenSmall}
                                                        <Text
                                                            style={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>{'  '}Send
                                                            Tracking Link</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                :
                                                null
                                        }


                                        {
                                            orderData.address
                                                ?
                                                <View style={[Styles.p10, Styles.flex1]}>
                                                    {/*//contact*/}
                                                    <View
                                                        style={[Styles.bgWhite, Styles.OrdersScreenCardshadow, Styles.padH10, Styles.padV5]}>
                                                        <Text
                                                            style={[Styles.ffMextrabold, Styles.alignCenter, Styles.f16, Styles.padV3, Styles.cBlk]}>Customer
                                                            Contact:</Text>
                                                        <View style={[Styles.row, Styles.jSpaceBet]}>
                                                            <Text
                                                                style={[Styles.aslCenter, Styles.f18, Styles.ffMregular]}>{orderData.address.firstname}{' '}{orderData.address.lastname}</Text>
                                                            <MaterialIcons name="phone" size={25} color="black"
                                                                           style={[Styles.aslCenter, Styles.p5]}
                                                                           onPress={() => {
                                                                               Linking.openURL(`tel:${orderData.address.telephone}`)
                                                                           }}/>
                                                        </View>
                                                    </View>
                                                    {/*PICKUP*/}
                                                    {
                                                        orderData.pickUpAddress
                                                            ?
                                                            <View
                                                                style={[Styles.bgWhite, Styles.OrdersScreenCardshadow, Styles.padH10, Styles.padV5, Styles.mTop10]}>
                                                                <Text
                                                                    style={[Styles.ffMextrabold, Styles.alignCenter, Styles.f16, Styles.padV3, Styles.cBlk]}>Pick-Up
                                                                    Address:</Text>
                                                                <View style={[Styles.row, Styles.jSpaceBet]}>
                                                                    <View>
                                                                        <Text
                                                                            style={[Styles.ffMregular, Styles.f16, Styles.flexWrap, Styles.cBlk]}>{orderData.pickUpAddress.streetAddress},</Text>
                                                                        {
                                                                            orderData.pickUpAddress.city
                                                                                ? <Text
                                                                                    style={[Styles.ffMregular, Styles.f14, Styles.cBlk]}>{orderData.pickUpAddress.city},</Text> : null
                                                                        }
                                                                        <Text
                                                                            style={[Styles.ffMregular, Styles.f16, Styles.cBlk]}>{orderData.pickUpAddress.region}-{orderData.pickUpAddress.postcode}</Text>
                                                                    </View>
                                                                    <View style={[Styles.aslCenter]}>
                                                                        <MaterialIcons name="navigation"
                                                                                       size={30}
                                                                                       color={'#fff'}
                                                                                       onPress={() => {
                                                                                           const location = orderData.pickUpAddress.location;
                                                                                           if (location) {
                                                                                               Linking.openURL('google.navigation:q=' + location.latitude + '+' + location.longitude)
                                                                                           } else {
                                                                                               Utils.dialogBox('No Locations Found', '');
                                                                                           }
                                                                                       }}
                                                                                       style={[Styles.p3, Styles.bgBlueGreenMix, Styles.br5, Styles.aslCenter]}/>
                                                                    </View>
                                                                </View>
                                                            </View>
                                                            :
                                                            null
                                                    }
                                                    {/*DELIVERED*/}
                                                    <View
                                                        style={[Styles.bgWhite, Styles.OrdersScreenCardshadow, Styles.padH10, Styles.padV5, Styles.mTop10]}>
                                                        <Text
                                                            style={[Styles.ffMbold, Styles.alignCenter, Styles.f16, Styles.padV3, Styles.cBlk]}>Delivery
                                                            Address:</Text>
                                                        <View style={[Styles.row, Styles.jSpaceBet]}>
                                                            <View>
                                                                <Text
                                                                    style={[Styles.ffMregular, Styles.f16, Styles.flexWrap, Styles.cBlk]}>{orderData.address.streetAddress},</Text>
                                                                {
                                                                    orderData.address.city
                                                                        ? <Text
                                                                            style={[Styles.ffMregular, Styles.f14, Styles.cBlk]}>{orderData.address.city},</Text> : null
                                                                }
                                                                <Text
                                                                    style={[Styles.ffMregular, Styles.f16, Styles.cBlk]}>{orderData.address.region}-{orderData.address.postcode}</Text>
                                                            </View>
                                                            <View style={[Styles.aslCenter]}>
                                                                <MaterialIcons name="navigation"
                                                                               size={30}
                                                                               color={'#fff'}
                                                                               onPress={() => {
                                                                                   const location = orderData.address.location;
                                                                                   if (location) {
                                                                                       Linking.openURL('google.navigation:q=' + location.latitude + '+' + location.longitude)
                                                                                   } else {
                                                                                       Utils.dialogBox('No Locations Found', '');
                                                                                   }
                                                                               }}
                                                                               style={[Styles.p3, Styles.bgGrn72, Styles.br5, Styles.aslCenter]}/>
                                                            </View>
                                                        </View>
                                                    </View>

                                                    <View
                                                        style={[Styles.bgWhite, Styles.OrdersScreenCardshadow, Styles.padH10, Styles.mTop10]}>
                                                        <View style={[Styles.padV5, Styles.mTop5]}>
                                                            <Text style={[Styles.ffMbold, Styles.f16]}>ETA,</Text>
                                                            <Text
                                                                style={[Styles.ffMregular, Styles.f16]}>{orderData.estimatedTimeOfArrival ? orderData.estimatedTimeOfArrival : '--'}</Text>
                                                        </View>

                                                        {/*Cash Collected */}
                                                        <View style={[Styles.marV5]}>
                                                            <View style={[Styles.padV5, Styles.flexWrap]}>
                                                                <Text style={[Styles.ffMbold, Styles.f16]}>Order
                                                                    Amount: <FontAwesome name="inr" size={16}
                                                                                         color="#000"
                                                                                         style={[Styles.aslCenter]}/> {orderData.payment.amount_ordered} ({orderData.paymentType === "COD" ? 'Cash on Delivery' : 'Prepaid'})
                                                                </Text>
                                                            </View>

                                                            {
                                                                // this.state.orderData.status === "ATTEMPTED" ||
                                                                orderData.status === 'REJECTED_BY_CUSTOMER' || orderData.status === 'DELIVERED' || orderData.status === 'REJECTED'
                                                                || orderData.status === 'REJECTED_BY_DA' || orderData.status === 'CANCELLED' || orderData.status === "PARTIALLY_DELIVERED"
                                                                    ?
                                                                    null
                                                                    :
                                                                    orderData.paymentType === "COD"
                                                                        ?
                                                                        <View style={[Styles.row,]}>
                                                                            <View
                                                                                style={[Styles.row, {
                                                                                    // width: 85,
                                                                                    borderBottomWidth: 1,
                                                                                    borderBottomColor: '#000',
                                                                                }]}>
                                                                                <FontAwesome name="inr" size={23}
                                                                                             color="#000"
                                                                                             style={[Styles.aslCenter]}/>
                                                                                <TextInput
                                                                                    style={[Styles.aslCenter, Styles.ffMregular, Styles.f18]}
                                                                                    selectionColor={"black"}
                                                                                    placeholder={'enter collected amount  '}
                                                                                    keyboardType='numeric'
                                                                                    onChangeText={(cashCollected) => {
                                                                                        this.CashCollectedValidate(cashCollected)
                                                                                    }}
                                                                                    value={this.state.cashCollected}
                                                                                    // writingDirection={'rtl'}
                                                                                />
                                                                            </View>
                                                                        </View>
                                                                        :
                                                                        null
                                                            }

                                                        </View>

                                                    </View>


                                                </View>
                                                :
                                                null
                                        }
                                        {
                                            orderData.status
                                            ?
                                            // this.state.orderData.status === "ATTEMPTED" ||
                                            orderData.status=== 'REJECTED_BY_CUSTOMER'
                                            || orderData.status === 'DELIVERED' || orderData.status === 'REJECTED'
                                            || orderData.status === 'REJECTED_BY_DA' || orderData.status === 'CANCELLED'
                                            || orderData.status === "PARTIALLY_DELIVERED"
                                                ?
                                                null
                                                :
                                                <View>
                                                    {
                                                        this.state.picUploaded
                                                            ?
                                                            <View>
                                                                <View
                                                                    style={[Styles.row, Styles.aitCenter, Styles.marV5, Styles.padH10]}>
                                                                    <View
                                                                        style={[Styles.row, Styles.bgDullYellow, Styles.br5, Styles.aslCenter, Styles.p5, {width: Dimensions.get('window').width / 1.6}]}>
                                                                        {LoadSVG.cameraPic}
                                                                        <Text
                                                                            style={[Styles.f16, Styles.cDisabled, Styles.ffMregular]}>Upload
                                                                            Delivered Item Pic</Text>
                                                                    </View>

                                                                    <TouchableOpacity
                                                                        onPress={() => {
                                                                            this.setState({
                                                                                picUploaded: false,
                                                                                ImageData: ''
                                                                            })
                                                                        }}
                                                                        style={[Styles.bw1, Styles.br5, Styles.aslCenter, Styles.bgBlk, Styles.mLt10]}>
                                                                        <Text
                                                                            style={[Styles.f16, Styles.padH5, Styles.padV5, Styles.ffMextrabold, Styles.cWhite]}>Delete</Text>
                                                                    </TouchableOpacity>
                                                                </View>

                                                                <View style={[Styles.row, Styles.p5, Styles.aslCenter]}>

                                                                    <View
                                                                        style={[Styles.bw1, Styles.bgDWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 80,}]}>
                                                                        <TouchableOpacity
                                                                            style={[Styles.row, Styles.aslCenter]}
                                                                            onPress={() => {
                                                                                this.setState({
                                                                                    imagePreview: true,
                                                                                    imagePreviewURL: this.state.ImageData.path ? this.state.ImageData.path : ''
                                                                                })
                                                                            }}>
                                                                            <Image
                                                                                onLoadStart={() => this.setState({imageLoading: true})}
                                                                                onLoadEnd={() => this.setState({imageLoading: false})}
                                                                                style={[{
                                                                                    width: Dimensions.get('window').width / 2,
                                                                                    height: 120
                                                                                }, Styles.marV15, Styles.aslCenter, Styles.bgLYellow, Styles.ImgResizeModeStretch]}
                                                                                source={this.state.ImageData.path ? {uri: this.state.ImageData.path} : null}
                                                                            />
                                                                            <MaterialCommunityIcons name="resize"
                                                                                                    size={24}
                                                                                                    color="black"/>
                                                                        </TouchableOpacity>
                                                                        <ActivityIndicator
                                                                            style={[Styles.ImageUploadActivityIndicator]}
                                                                            animating={this.state.imageLoading}
                                                                        />
                                                                    </View>

                                                                </View>
                                                            </View>
                                                            :
                                                            <TouchableOpacity onPress={() => {
                                                                // this.deliveredOrderUpload()
                                                                this.setState({imageSelectionModal: true})
                                                            }}
                                                                              style={[Styles.aslStart, Styles.marV5, Styles.marH10]}>
                                                                <View
                                                                    style={[Styles.row, Styles.bgDullYellow, Styles.br5, Styles.aslCenter, Styles.p5, {width: Dimensions.get('window').width / 1.5}]}>
                                                                    {LoadSVG.cameraPic}
                                                                    <Text
                                                                        style={[Styles.f16, Styles.cBlk, Styles.ffMregular]}>Upload
                                                                        Delivered Item Pic</Text>
                                                                </View>
                                                            </TouchableOpacity>
                                                    }


                                                    {/* FOOTER BUTTON*/}
                                                    <View style={[Styles.row, Styles.jSpaceArd, Styles.marV15]}>
                                                        <TouchableOpacity
                                                            activeOpacity={0.7}
                                                            style={[Styles.padH5, Styles.bgRed, Styles.width120]}
                                                            onPress={() => {
                                                                if (this.state.orderItems.length > 0) {
                                                                    if (this.state.itemIds.length > 0) {
                                                                        this.setState({
                                                                            selectedButton: 'REJECT',
                                                                            swipeActivated: true
                                                                        }, () => {
                                                                            // this.rejectOrderByCustomer()
                                                                            this.validatingLocation()
                                                                        })
                                                                    } else {
                                                                        Utils.dialogBox('Please select at least one item to Reject', '')
                                                                    }
                                                                } else {
                                                                    this.setState({
                                                                        selectedButton: 'REJECT',
                                                                        swipeActivated: true
                                                                    }, () => {
                                                                        // this.rejectOrderByCustomer()
                                                                        this.validatingLocation()
                                                                    })
                                                                }
                                                            }}>
                                                            <Text
                                                                style={[Styles.f18, Styles.ffMbold, Styles.cWhite, Styles.padH10, Styles.padV10, Styles.aslCenter]}>Reject</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            activeOpacity={0.7}
                                                            style={[Styles.padH5, Styles.bgGrn, Styles.width120]}
                                                            onPress={() => {
                                                                this.setState({swipeActivated: true}, () => {
                                                                    if (this.state.orderItems.length > 0) {
                                                                        if (this.state.itemIds.length > 0) {
                                                                            if (this.state.cashCollected) {
                                                                                if (this.state.picUploaded === true) {
                                                                                    this.setState({
                                                                                        selectedButton: 'DELIVER',
                                                                                        swipeActivated: true
                                                                                    }, () => {
                                                                                        this.validatingLocation()
                                                                                    })
                                                                                } else {
                                                                                    Utils.dialogBox('Please upload picture', '')
                                                                                }
                                                                            } else {
                                                                                Utils.dialogBox('Please enter cash collected', '')
                                                                            }
                                                                        } else {
                                                                            Utils.dialogBox('Please select the delivery items', '')
                                                                        }
                                                                    } else {
                                                                        if (this.state.cashCollected) {
                                                                            if (this.state.cashCollected === JSON.stringify(this.state.orderData.payment.amount_ordered)) {
                                                                                if (this.state.picUploaded === true) {
                                                                                    this.setState({
                                                                                        selectedButton: 'DELIVER',
                                                                                        swipeActivated: true
                                                                                    }, () => {
                                                                                        this.validatingLocation()
                                                                                    })
                                                                                } else {
                                                                                    Utils.dialogBox('Please upload picture', '')
                                                                                }
                                                                            } else {
                                                                                Utils.dialogBox('Please enter valid cash collected', '')
                                                                            }
                                                                        } else {
                                                                            Utils.dialogBox('Please enter cash collected', '')
                                                                        }
                                                                    }
                                                                })
                                                            }}
                                                        >
                                                            <Text
                                                                style={[Styles.f18, Styles.ffMbold, Styles.cWhite, Styles.padH10, Styles.padV10, Styles.aslCenter]}>Deliver</Text>
                                                        </TouchableOpacity>
                                                    </View>

                                                    {/*ATTEMPT REASON*/}
                                                    {
                                                        orderData.status === "ATTEMPTED"
                                                            ? null
                                                            :
                                                            <View
                                                                style={[Styles.OrdersScreenCardshadow, Styles.bgWhite, Styles.m5]}>
                                                                <Text
                                                                    style={[Styles.ffMbold, Styles.cBlk, Styles.padH10, Styles.f18]}>If
                                                                    not
                                                                    delivered, select the reason</Text>
                                                                {this.state.OrderNotDeliveredReasonsList.map(item => {
                                                                    return (
                                                                        <View key={item.value}>
                                                                            <RadioButton.Group
                                                                                style={[Styles.row, Styles.aslCenter]}
                                                                                onValueChange={cancelReasonValue => this.setState({
                                                                                    cancelReasonValue,
                                                                                    CancelShiftReason: item.reason,
                                                                                    orderStatus: item.status,
                                                                                    otherReasontoCancel: ''
                                                                                })}
                                                                                value={this.state.cancelReasonValue}
                                                                            >
                                                                                <View style={[Styles.row]}>
                                                                                    <RadioButton
                                                                                        style={[{paddingTop: 2}]}
                                                                                        value={item.value}
                                                                                        color='green'/>
                                                                                    <Text
                                                                                        style={[Styles.aslCenter, Styles.ffMregular, Styles.f16,]}>{item.reason}</Text>
                                                                                </View>
                                                                            </RadioButton.Group>
                                                                        </View>
                                                                    );
                                                                })}
                                                                {
                                                                    this.state.cancelReasonValue === '4'
                                                                        ?
                                                                        <View style={[Styles.p10]}>
                                                                            <Text
                                                                                style={[Styles.ffMregular, Styles.cBlk, Styles.padH10, Styles.f18]}>Add
                                                                                a note</Text>
                                                                            <TextInput
                                                                                placeholder={'comments'}
                                                                                style={[Styles.ffMregular, Styles.f18, Styles.padH10, Styles.brdrBtm1]}
                                                                                selectionColor={"black"}
                                                                                onChangeText={otherReasontoCancel => this.setState({otherReasontoCancel})}
                                                                                value={this.state.otherReasontoCancel}
                                                                                // writingDirection={'rtl'}
                                                                            />
                                                                        </View>
                                                                        :
                                                                        null
                                                                }
                                                                <View
                                                                    style={[Styles.row, Styles.jSpaceArd, Styles.p10, Styles.mBtm10]}>
                                                                    <TouchableOpacity
                                                                        activeOpacity={0.7}
                                                                        onPress={() => this.setState({cancelReasonValue: ''})}
                                                                        style={[Styles.aslCenter, Styles.br5, {backgroundColor: '#e3e3e3'}, Styles.width120]}>
                                                                        <Text
                                                                            style={[Styles.ffMbold, Styles.aslCenter, Styles.padH10, Styles.padV10, Styles.f18,]}>Cancel</Text>
                                                                    </TouchableOpacity>
                                                                    <TouchableOpacity
                                                                        disabled={!this.state.cancelReasonValue}
                                                                        onPress={() => this.validateCancelShiftReason()}
                                                                        style={[Styles.aslCenter, Styles.br5, {backgroundColor: !this.state.cancelReasonValue ? '#cccccc' : '#db99ff'}, Styles.width120]}>
                                                                        <Text
                                                                            style={[Styles.ffMbold, Styles.cWhite, Styles.aslCenter, Styles.padH10, Styles.padV10, Styles.f18,]}>Submit</Text>
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </View>
                                                    }

                                                </View>
                                                :
                                                null
                                        }
                                    </ScrollView>
                                    :
                                    null
                            }


                        </View>
                        :
                        <CSpinner/>
                }

                {/*MODALS START*/}

                {/*MODAL FOR ORDER CONFIRM*/}
                <Modal
                    transparent={true}
                    visible={this.state.orderConfirmModal}
                    animationType={'fade'}
                    onRequestClose={() => {
                        this.setState({orderConfirmModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, {width: Dimensions.get('window').width - 20, }]}>
                            <View style={[Styles.aslCenter,Styles.m5,Styles.padV10]}>
                                <Text style={[Styles.ffMregular,Styles.cBlk, Styles.aslCenter, Styles.p5, Styles.f18,]}>Are you sure you want to{' '}
                                    <Text style={[Styles.ffMbold,Styles.cBlk,Styles.f18,]}>{this.state.selectedButton}</Text> the list ?</Text>
                            </View>
                            <ScrollView style={[Styles.marH5]}>
                                {
                                    this.state.finalList.length > 0
                                        ?
                                        <View style={{flex:1,alignItems: 'center'}}>
                                            <Row size={12} nowrap
                                                 style={[Styles.row, Styles.padV10, Styles.alignCenter,Styles.bgOrangeYellow]}>
                                                <Col sm={4}>
                                                    <Text
                                                        style={[Styles.ffMextrabold, Styles.f16, Styles.aslCenter]}>Items</Text>
                                                </Col>
                                                <Col sm={3}>
                                                    <Text
                                                        style={[Styles.ffMextrabold, Styles.f16, Styles.aslCenter]}>Total</Text>
                                                </Col>
                                                <Col sm={2.5}>
                                                    <Text
                                                        style={[Styles.ffMextrabold, Styles.f16, Styles.aslCenter]}>Deliver</Text>
                                                </Col>
                                                <Col sm={2.5}>
                                                    <Text
                                                        style={[Styles.ffMextrabold, Styles.f16, Styles.aslCenter]}>Reject</Text>
                                                </Col>
                                            </Row>
                                            <View style={[Styles.row, Styles.aslCenter]}>
                                                {
                                                    this.state.finalList.length > 0 ?
                                                        <FlatList
                                                            style={[{height: Dimensions.get('window').height/1.8},Styles.bgWhite]}
                                                            data={this.state.finalList}
                                                            renderItem={({item, index}) => (
                                                                <Row size={12} nowrap
                                                                     style={[Styles.row, Styles.p5, Styles.aslCenter, {
                                                                         // backgroundColor: ((index % 2) === 0 ? '#f5f5f5' : '#fff')
                                                                         backgroundColor: ((index % 2) === 0 ? '#ccf6d8' : '#e4b7d4')
                                                                     }
                                                                     ]}>
                                                                    <Col sm={4}>
                                                                        <Text  style={[Styles.ffMbold, Styles.f14, {textAlignVertical: 'center'}]}>{_.startCase(item.name) || '---'}</Text>
                                                                    </Col>
                                                                    <Col sm={3}>
                                                                        <Text  style={[Styles.ffMbold, Styles.f14,Styles.aslCenter]}>{Services.returnINRhtmlcode(item.price) || '---'}({item.itemQuantity})</Text>
                                                                    </Col>
                                                                    <Col sm={2.5}>
                                                                        <Text  style={[Styles.ffMbold,Styles.colorGreen, Styles.f14,Styles.aslCenter]}>{item.tempDelivered}</Text>
                                                                    </Col>
                                                                    <Col sm={2.5}>
                                                                        <Text  style={[Styles.ffMbold,Styles.cRed, Styles.f14,Styles.aslCenter]}>{item.tempRejected}</Text>
                                                                    </Col>
                                                                </Row>
                                                            )}
                                                            keyExtractor={(item, index) => index.toString()}
                                                        />
                                                        :
                                                        <Text
                                                            style={[Styles.cBlk, Styles.f20, Styles.aslCenter, Styles.ffMregular]}>
                                                            No Items in the list.</Text>
                                                }
                                            </View>

                                        </View>
                                        :
                                        null
                                }
                            </ScrollView>
                            <View style={[Styles.row, Styles.jSpaceArd, Styles.p10, Styles.mBtm10]}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => this.setState({orderConfirmModal: false})}
                                                  style={[Styles.aslCenter, Styles.br5,Styles.bgBlk,Styles.width120]}>
                                    <Text
                                        style={[Styles.ffMbold,Styles.cWhite, Styles.aslCenter, Styles.padH5,Styles.padV10, Styles.f16,]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() =>{
                                    this.setState({orderConfirmModal: false,orderConfirmed:true,swipeActivated:true,Button:'CONFIRMATION'},()=>{
                                        this.validatingLocation()
                                    })
                                } }
                                                  style={[Styles.aslCenter, Styles.br5,Styles.bgGrn,Styles.width120]}>
                                    <Text
                                        style={[Styles.ffMbold, Styles.cWhite, Styles.aslCenter, Styles.padH5,Styles.padV10, Styles.f16,]}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                    </View>
                </Modal>

                {/*Images Preview Modal*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.imagePreview}
                    onRequestClose={() => {
                        this.setState({imagePreview: false, imagePreviewURL: ''})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.flex1, Styles.bgWhite, {
                            width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height
                        }]}>
                            {this.state.spinnerBool === false ? null : <CSpinner/>}
                            <Appbar.Header style={[Styles.bgDarkRed, Styles.jSpaceBet]}>
                                <Appbar.Content title="Image Preview"
                                                titleStyle={[Styles.ffMbold]}/>
                                <MaterialCommunityIcons name="window-close" size={32}
                                                        color="#000" style={{marginRight: 10}}
                                                        onPress={() =>
                                                            this.setState({imagePreview: false, imagePreviewURL: ''})
                                                        }/>
                            </Appbar.Header>
                            <View style={[Styles.flex1]}>
                                {
                                    this.state.imagePreviewURL
                                        ?
                                        <View>
                                            <View style={[Styles.row,Styles.jSpaceBet]}>
                                                <View/>
                                                <TouchableOpacity style={[Styles.row,Styles.marH10 ]}
                                                                  onPress={() => {this.rotate()} }>
                                                    <Text style={[Styles.cBlk,Styles.f18,Styles.padH5]}>ROTATE</Text>
                                                    <FontAwesome name="rotate-right" size={24} color="black"
                                                    />
                                                </TouchableOpacity>
                                            </View>

                                            <ImageZoom cropWidth={Dimensions.get('window').width}
                                                       cropHeight={Dimensions.get('window').height}
                                                       imageWidth={Dimensions.get('window').width }
                                                       imageHeight={Dimensions.get('window').height}>
                                                <Image
                                                    onLoadStart={() => this.setState({previewLoading: true})}
                                                    onLoadEnd={() => this.setState({previewLoading: false})}
                                                    style={[{
                                                        width: Dimensions.get('window').width - 20,
                                                        height: Dimensions.get('window').height - 90,
                                                        transform: [{rotate: this.state.imageRotate+'deg'}]
                                                    }, Styles.marV5, Styles.aslCenter, Styles.bgDWhite,Styles.ImgResizeModeContain]}
                                                    source={this.state.imagePreviewURL ? {uri: this.state.imagePreviewURL} : null}
                                                />
                                            </ImageZoom>
                                            <ActivityIndicator
                                                style={[Styles.ImageUploadActivityIndicator]}
                                                animating={this.state.previewLoading}
                                            />
                                        </View>
                                        :
                                        null
                                }

                            </View>


                        </View>
                    </View>
                </Modal>

                {/*MODAL FOR IMAGE UPLOAD SELECTION*/}
                <Modal
                    transparent={true}
                    animated={true}
                    animationType='slide'
                    visible={this.state.imageSelectionModal}
                    onRequestClose={() => {
                        this.setState({imageSelectionModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({imageSelectionModal: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        <View
                            style={[Styles.bgWhite, Styles.aslCenter, Styles.p10,  {width: Dimensions.get('window').width - 80}]}>

                            <View style={[Styles.p10]}>
                                <Text style={[Styles.f22,Styles.cBlk,Styles.txtAlignCen,Styles.ffLBlack,Styles.pBtm10]}>Add Image</Text>
                                <View style={[Styles.marV15]}>
                                    <TouchableOpacity
                                        onPress={()=>{this.setState({imageSelectionModal:false},()=>{
                                            this.deliveredOrderUpload('CAMERA')
                                        })}}
                                        activeOpacity={0.7} style={[Styles.marV10,Styles.row,Styles.aitCenter]}>
                                        <FontAwesome name="camera" size={24} color="black" />
                                        <Text style={[Styles.f20,Styles.cBlk,Styles.ffLBold,Styles.padH10]}>Take Photo</Text>
                                    </TouchableOpacity>
                                    <Text style={[Styles.ffLBlack,Styles.brdrBtm1,Styles.mBtm15]}/>
                                    <TouchableOpacity
                                        onPress={()=>{this.setState({imageSelectionModal:false},()=>{
                                            this.deliveredOrderUpload('LIBRARY')
                                        })}}
                                        activeOpacity={0.7} style={[Styles.marV10,Styles.row,Styles.aitCenter]}>
                                        <FontAwesome name="folder" size={24} color="black" />
                                        <Text style={[Styles.f20,Styles.cBlk,Styles.ffLBold,Styles.padH10]}>Gallery</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                        </View>
                        {/*<TouchableOpacity style={{marginTop: 20}} onPress={() => {*/}
                        {/*    this.setState({imageSelectionModal: false})*/}
                        {/*}}>*/}
                        {/*    {LoadSVG.cancelIcon}*/}
                        {/*</TouchableOpacity>*/}
                    </View>
                </Modal>

                {/*MODALS END*/}
            </View>
        );
    }
}


