import React from 'react';
import {
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Linking,
    PermissionsAndroid, Alert, Dimensions, Modal, TextInput, Keyboard
} from 'react-native';
import {Styles, CSpinner, LoadSVG, CText} from '../common'
import Utils from "../common/Utils";
import Config from "../common/Config";
import Services from "../common/Services";
import {
    Appbar,
    Card, Chip,
    DefaultTheme,
} from "react-native-paper";
import OfflineNotice from '../common/OfflineNotice';
import OneSignal from "react-native-onesignal";
import HomeScreen from "../HomeScreen";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import Geolocation from "react-native-geolocation-service";
import RNAndroidLocationEnabler from "react-native-android-location-enabler";
import {CheckBox} from "react-native-elements";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import _ from "lodash";


const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};
const winW = Dimensions.get('window').width;
const winH = Dimensions.get('window').height;
export default class OrdersListScreen extends React.Component {

    constructor(props) {
        super(props);
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
            spinnerBool: false, CurrentShiftId: '', selectedOrderId: '', swipeActivated: false,
            ordersList: [], checkedAll: false, checkOrder: false, selectedOrderList: [], tempOrdersList: [], Button: '',
            rejectReason:'',errorRejectReason:null,rejectReasonModal:false,selectedChip: '',
            chipsList: [
                {status: '', name: 'All', value: 1},
                {status: 'OUT_ON_ROAD', name: 'On Road', value: 3},
                {status: 'DELIVERED', name: 'Delivered', value: 2},
                {status: 'READY_FOR_PICKUP', name: 'At Station', value: 4},
                {status: 'ATTEMPTED', name: 'Attempted', value: 6},
                // {status: 'REJECTED', name: 'Rejected', value: 7},
                {status: 'REJECTED_BY_DA', name: 'Rejected by DA', value: 8},
                {status: 'PARTIALLY_DELIVERED', name: 'Partial Delivered', value: 5},
                {status: 'REJECTED_BY_CUSTOMER', name: 'Rejected by Customer', value: 9},
                {status: 'CANCELLED', name: 'Cancelled', value: 9},
            ],
        };
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    componentDidMount() {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            this.requestLocationPermission();
            this.setState({
                CurrentShiftId: self.props.navigation.state.params.CurrentShiftId,
                selectedChip: self.props.navigation.state.params.selectedChip,
                selectedOrderList:[],
            }, () => {
                this.getUserOrders()
            })
                // Services.checkMockLocationPermission((response) => {
                //     if (response){
                //         this.props.navigation.navigate('Login')
                //     }
                // })
        })
    }

    //error handling
    errorHandling(error) {
        // console.log("orders list error", error, error.response);
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

    requestLocationPermission = async()=> {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                Geolocation.getCurrentPosition(
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
                            } else if (this.state.swipeActivated === true && currentLocation.latitude && currentLocation.longitude) {
                                this.validatingLocation()
                            }
                        });
                    },
                    (error) => {
                        console.log(error.code, error.message);
                        // console.log('end shift error perms lat long',this.state.latitude,this.state.longitude)
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
                            console.log(error.code, error.message);
                            Utils.dialogBox(error.message, '')
                            this.props.navigation.goBack()
                        }
                    },
                    // {enableHighAccuracy: false, timeout: 10000, maximumAge: 100000}
                    {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
                );
            } else {
                Utils.dialogBox('Location permission denied', '');
                this.props.navigation.goBack();
            }
        } catch (err) {
            console.warn(err);
            Utils.dialogBox(err, '')
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
         if (latitude  && longitude ) {
            // this.requestLocationPermission();
            let tempBody = {}
            tempBody.location = {"latitude": latitude, "longitude": longitude}
           if (this.state.swipeActivated === true) {
                if (this.state.Button === 'MULTIPLE_REJECT') {
                    this.MultipleRejectOrder(tempBody)
                } else if (this.state.Button === 'SINGLE_REJECT') {
                    this.singleOrderReject(tempBody)
                } else if (this.state.Button === 'MULTIPLE_ACCEPT') {
                    this.MultipleStartOrder(tempBody)
                } else if (this.state.Button === 'SINGLE_START') {
                    this.singleStartOrder(tempBody)
                }
            }
        } else {
            Alert.alert('', 'Your Location data is missing,Please check your Location Settings',
                [{
                    text: 'enable', onPress: () => {
                        this.requestLocationPermission();
                    }
                }]);
        }
        })
    }

    //API CALL to START ORDER
    singleStartOrder = (body) => {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.START_ORDER
        body.id = self.state.selectedOrderId
        body.shiftId = self.state.CurrentShiftId
        // console.log('single start Order apiURL====', apiURL,'body==',body);
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "PUT", body, function (response) {
                // console.log('single start order',response);
                if (response.status === 200) {
                    // console.log('start Order rep200====', response.data);
                    self.setState({spinnerBool: false, swipeActivated: false, selectedOrderList: []})
                    Utils.dialogBox('Order Picked', '');
                    self.getUserOrders()
                }
            }, function (error) {
                 self.errorHandling(error);
            })
        });
    };

    //API CALL to REJECT ORDER
    singleOrderReject=(body)=> {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.REJECT_ORDER;
        body.id = self.state.selectedOrderId
        // body.reason = 'reject'
        body.reason = self.state.rejectReason
        body.shiftId = self.state.CurrentShiftId
        // console.log('single reject Order apiURL====', apiURL,'body==',body);
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "PUT", body, function (response) {
                if (response.status === 200) {
                    // console.log('Reject Order rep200====', response.data);
                    self.setState({spinnerBool: false, swipeActivated: false, selectedOrderList: [],rejectReasonModal:false,rejectReason:'',errorRejectReason: null})
                    Utils.dialogBox('Order Rejected', '');
                    self.getUserOrders()
                }
            }, function (error) {
                 self.errorHandling(error);
            })
        });
    };


    //get user orders list
    getUserOrders() {
        const self = this;
        const CurrentShiftId = self.props.navigation.state.params.CurrentShiftId;
        // const apiURL = Config.routes.BASE_URL + Config.routes.GET_ALL_ORDERS_LIST  ;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_ORDERS_LIST + '?shiftId=' + CurrentShiftId + '&status='+ self.state.selectedChip;
        const body = {};
        // console.log('getUserOrders apiURL', apiURL);
        this.setState({spinnerBool: true,ordersList:[]}, () => {
            Services.AuthHTTPRequest(apiURL, 'POST', body, function (response) {
                if (response.status === 200) {
                    let tempData = response.data;
                    const UpdatedData = [];
                    for (let i = 0; i < tempData.length; i++) {
                        let tempPos = tempData[i]
                        tempPos.orderSelected = false
                        UpdatedData.push(tempPos)
                    }
                    // console.log("getUserOrders updateSelectedList", UpdatedData);
                    self.setState({
                        // ordersList: response.data,
                        ordersList: UpdatedData,
                        tempOrdersList: response.data,
                        // selectedOrderList:[],
                        checkedAll:false,
                        spinnerBool: false
                    })
                }
            }, function (error) {
                self.errorHandling(error);
            })
        })
    }


    //API CALL to MULTIPLE START ORDER
    MultipleStartOrder = (body) => {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.MULTIPLE_START_ORDER;
        body.orderIds = this.state.selectedOrderList;
        body.shiftId = self.state.CurrentShiftId;
        // console.log('MultipleStart Order apiURL====', apiURL,'body==',body);
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "PUT", body, function (response) {
                if (response.status === 200) {
                    // console.log('Multiple Start Order rep200====', response.data);
                    self.setState({spinnerBool: false, swipeActivated: false, selectedOrderList: [], Button: ''})
                    Utils.dialogBox('Selected Orders are Picked', '');
                    self.getUserOrders()
                }
            }, function (error) {
                // console.log(' MultipleStart Order eror', error)
                self.errorHandling(error);
            })
        });
    };

    //API CALL to MULTIPLE REJECT ORDER
    MultipleRejectOrder=(body)=> {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.MULTIPLE_REJECT_ORDER;
        body.orderIds = self.state.selectedOrderList
        // body.reason = 'Reject'
        body.reason = self.state.rejectReason
        // console.log('Multiple reject Order apiURL====', apiURL,'body==',body);
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "PUT", body, function (response) {
                if (response.status === 200) {
                    // console.log('Multiple Reject Order rep200====', response.data);
                    self.setState({spinnerBool: false, swipeActivated: false, selectedOrderList: [],rejectReasonModal:false,rejectReason:'',errorRejectReason: null})
                    Utils.dialogBox('Selected Orders are Rejected', '');
                    self.getUserOrders()
                }
            }, function (error) {
                // console.log(' MultipleReject Order eror', error)
                self.errorHandling(error);
            })
        });
    };


    checkIndividual(orderId, status) {
        // console.log('orderId start', orderId,'status===',status)
        let tempArray = this.state.selectedOrderList;

        if (status === false) {
            tempArray = tempArray.filter(item => item !== orderId)
            this.setState({checkedAll: false})
        } else {
            tempArray.push(orderId);
        }
        // console.log('total tempArray ', tempArray)
        this.setState({selectedOrderList: tempArray});
    }

    checkCheckboxStatus() {
        let tempArray = [];
        if (this.state.checkedAll) {
            let tempData = this.state.ordersList;
            const UpdatedData = [];
            for (let p = 0; p < tempData.length; p++) {
                let tempPos = tempData[p]
                tempPos.orderSelected = true
                UpdatedData.push(tempPos);
                if (tempData[p].status === "READY_FOR_PICKUP") {
                    tempArray.push(tempData[p].id);
                }
            }
            this.setState({ordersList: UpdatedData})
        } else {
            tempArray = []
            let tempData = this.state.ordersList;
            const UpdatedData = [];
            for (let p = 0; p < tempData.length; p++) {
                let tempPos = tempData[p]
                tempPos.orderSelected = false
                UpdatedData.push(tempPos);
            }
            this.setState({ordersList: UpdatedData})
        }
        this.setState({selectedOrderList: tempArray});
    }

    render() {
        const {ordersList} = this.state
        const br = `\n`;
        return (
            <View style={[[Styles.flex1, Styles.bgWhite]]}>
                {this.renderSpinner()}
                <OfflineNotice/>
                <View style={[Styles.bgLBlueAsh, Styles.AuthScreenHeadershadow]}>
                    <Appbar.Header theme={theme} style={Styles.bgDarkRed}>
                        <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                        <Appbar.Content title="Orders" titleStyle={[Styles.ffMextrabold,Styles.cWhite]}/>
                        <TouchableOpacity style={[Styles.row, {left: 10}]}
                                          onPress={() => this.setState({checkedAll: !this.state.checkedAll}, () => {
                                              this.checkCheckboxStatus()
                                          })}>
                            <Text style={[Styles.f16, Styles.cWhite, Styles.ffMbold, Styles.aslCenter]}>Select
                                All</Text>
                            <CheckBox
                                containerStyle={[Styles.bgDarkRed,Styles.bw0]}
                                // checkedColor='#36A84C'
                                checkedColor='#fff'
                                size={25}
                                onPress={() => this.setState({checkedAll: !this.state.checkedAll}, () => {
                                    this.checkCheckboxStatus()
                                })}
                                checked={this.state.checkedAll}
                            />

                        </TouchableOpacity>
                    </Appbar.Header>
                </View>
                {/*CHIPS SECTION*/}
                <View
                    style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', padding: 10}}>
                    {/* CHIPS SECTION */}
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}
                                style={[Styles.row]}>
                        {this.state.chipsList.map((item, index) => {
                            return (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        this.setState({selectedChip: item.status, page: 1}, () => {
                                            this.getUserOrders()
                                        })
                                    }}
                                    style={[Styles.row,Styles.br15,Styles.padH5,Styles.padV5,{
                                    backgroundColor: this.state.selectedChip === item.status ? '#db2b30' : '#afadaf',
                                    marginHorizontal: 5,
                                }]}>
                                    <Text style={[Styles.ffLBold, Styles.cWhite,Styles.padH5]}>{item.name}</Text>
                                    {/*{item.status === '' ? null :*/}
                                    {/*    <FontAwesome name="circle" size={20}*/}
                                    {/*                 color={Services.returnOrderColorCode(item.status)}/>}*/}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
                <ScrollView style={[Styles.flex1,Styles.pBtm10,Styles.mBtm20,Styles.bgLBlueWhite]}>
                    {
                        this.state.ordersList.length > 0
                            ?
                            this.state.ordersList.map((list, index) => {
                                return (
                                    <View
                                        key={index}
                                        style={[Styles.row,Styles.flex1,Styles.padH5,Styles.pTop10,list.status === "READY_FOR_PICKUP" ? '':Styles.pBtm10]}>
                                        {/*<View  style={[Styles.alignCenter, {*/}
                                        {/*    borderLeftWidth: 2,*/}
                                        {/*    borderBottomLeftRadius: 0,*/}
                                        {/*    borderLeftColor: '#b2beb5',*/}
                                        {/*    position: 'absolute',*/}
                                        {/*    // marginTop: index === 0 ? 43 : 0,*/}
                                        {/*    marginTop: index === 0 ? 67 : 0,*/}
                                        {/*    marginBottom: ordersList.length - 1 === index ? 60 : 0,*/}
                                        {/*    top: 0,*/}
                                        {/*    left: 27,*/}
                                        {/*    right: 0,*/}
                                        {/*    bottom: 0*/}
                                        {/*}]}>*/}
                                        {/*</View>*/}
                                        {/*<View style={[Styles.aslCenter, Styles.p5]}>*/}
                                        {/*    <MaterialIcons name="timer" size={30}*/}
                                        {/*                   color={Services.returnOrderColorCode(list.status)}*/}
                                        {/*                   style={[Styles.aslCenter, Styles.bgDash]}/>*/}
                                        {/*</View>*/}
                                        <View style={[Styles.flex1]}>


                                        <View style={[Styles.flex1]}
                                              key={index}>


                                            <TouchableOpacity
                                                activeOpacity={0.9}
                                                onPress={() => {
                                                    list.status === 'READY_FOR_PICKUP'
                                                        ?
                                                        this.props.navigation.navigate('OrdersStartScreen', {orderData: list})
                                                        :
                                                        list.status === 'OUT_ON_ROAD' || list.status === 'PARTIALLY_DELIVERED' ||
                                                        list.status === 'DELIVERED' || list.status === 'REJECTED' || list.status === 'REJECTED_BY_DA' || list.status === 'REJECTED_BY_CUSTOMER' || list.status === 'CANCELLED' || list.status === 'ATTEMPTED'
                                                            ?
                                                            this.props.navigation.navigate('OrdersEndScreen', {
                                                                orderData: list,
                                                                shiftId: this.props.navigation.state.params.CurrentShiftId
                                                            })
                                                            : null
                                                }}
                                                style={[Styles.OrdersScreenCardshadow, Styles.bgWhite,

                                                    {
                                                        // marginBottom: 10,
                                                        // padding: 5,
                                                        borderLeftColor: Services.returnOrderColorCode(list.status),
                                                        borderLeftWidth: 5,
                                                        // backgroundColor:Services.getExpensesStatus(list.status)
                                                    }]}>
                                                <View style={[Styles.flex1, Styles.row, Styles.jSpaceBet,]}>

                                                <View style={[Styles.flex1]}>

                                                    <View style={[Styles.row,Styles.jSpaceBet,Styles.padH5,Styles.pBtm5,Styles.brdrBtm1,{borderBottomColor: '#b2beb5'}]}>
                                                        <Text  style={[Styles.f18, Styles.ffMbold,Styles.aslCenter,Services.returnOrderListColor(list.status)]}>{_.startCase(list.status)}</Text>

                                                        {
                                                            list.status === "READY_FOR_PICKUP"
                                                                ?
                                                                <View style={[Styles.row]}>
                                                                    <FontAwesome name="qrcode" size={30}
                                                                                 color="black"
                                                                                 style={[Styles.cBlk,Styles.pRight20,Styles.pTop5]}
                                                                                 onPress={() => {
                                                                                     this.props.navigation.navigate('OrderQRCode', {
                                                                                         orderData: list,
                                                                                         shiftId: this.props.navigation.state.params.CurrentShiftId
                                                                                     })
                                                                                 }}/>
                                                                    <TouchableOpacity
                                                                        style={[Styles.pTop3]}

                                                                        onPress={() => {
                                                                            let ordersList = [...this.state.ordersList]
                                                                            ordersList[index] = {
                                                                                ...ordersList[index],
                                                                                orderSelected: !list.orderSelected
                                                                            }
                                                                            this.setState({ordersList}, () => {
                                                                                this.checkIndividual(list.id, !list.orderSelected)
                                                                            })
                                                                        }}>
                                                                        {
                                                                            list.orderSelected
                                                                                ?
                                                                                <MaterialCommunityIcons
                                                                                    name="checkbox-marked" size={30}
                                                                                    color="green"/>
                                                                                :
                                                                                <MaterialCommunityIcons
                                                                                    name="checkbox-blank-outline"
                                                                                    size={30}
                                                                                    color="black"/>
                                                                        }

                                                                    </TouchableOpacity>
                                                                </View>
                                                                :
                                                                (list.status === 'OUT_ON_ROAD' || list.status === 'PARTIALLY_DELIVERED') && list.address
                                                                    ?
                                                                    <MaterialIcons name="navigation"
                                                                                   size={24}
                                                                                   color={'#fff'}
                                                                                   // onPress={() => Linking.openURL('google.navigation:q=18.0072+79.5584')}
                                                                                   onPress={() => {
                                                                                       const location = list.address.location;
                                                                                       if (location) {
                                                                                           Linking.openURL('google.navigation:q=' + location.latitude + '+' + location.longitude)
                                                                                       } else {
                                                                                           Utils.dialogBox('No Locations Found', '');
                                                                                       }
                                                                                   }}
                                                                                   style={[Styles.m3,Styles.p2, Styles.bgGrn72, Styles.br5, Styles.aslCenter]}/>
                                                                    :
                                                                    null

                                                        }
                                                    </View>

                                                    <View style={[Styles.row,Styles.padH5]}>
                                                        <View style={[Styles.flex1,Styles.padV10,]}>

                                                            <View style={[Styles.row, Styles.pRight5,Styles.mBtm1]}>
                                                                <Text
                                                                    style={[Styles.ffMextrabold, Styles.f14, Styles.cAsh, Styles.pRight5,]}>Order Id</Text>
                                                                <Text
                                                                    numberOfLines={2}
                                                                    style={[Styles.ffMbold, Styles.f14, Styles.cBlk,{width:winW/1.7}]}>{list.orderId}</Text>
                                                            </View>
                                                            {
                                                                list.siteCode
                                                                    ?
                                                                    <View style={[Styles.row,Styles.mBtm1]}>
                                                                        <Text
                                                                            style={[Styles.ffMextrabold, Styles.f14, Styles.cAsh, Styles.pRight5,]}>Site
                                                                            Code</Text>
                                                                        <Text
                                                                            style={[Styles.f14, Styles.cBlk, Styles.ffMbold, Styles.pBtm5,]}>{list.siteCode}</Text>
                                                                    </View>
                                                                    :
                                                                    null
                                                            }

                                                            {
                                                                list.wmsOrderId
                                                                    ?
                                                                    <View
                                                                        style={[Styles.row, Styles.pRight5,Styles.mBtm1]}>
                                                                        <Text
                                                                            style={[Styles.ffMextrabold,Styles.cAsh, Styles.f14, Styles.pRight5,]}>WMS
                                                                            Order Id</Text>
                                                                        <Text
                                                                            numberOfLines={2}
                                                                            style={[Styles.ffMbold, Styles.f14, Styles.cBlk, {width: winW / 1.5}]}>{list.wmsOrderId}</Text>

                                                                    </View>
                                                                    :
                                                                    null
                                                            }
                                                                <View style={[Styles.row, Styles.pRight5,Styles.mBtm1]}>
                                                                    <Text
                                                                        style={[Styles.ffMextrabold, Styles.f14, Styles.cAsh, Styles.pRight5,]}>Customer Name</Text>
                                                                    <Text
                                                                        numberOfLines={2}
                                                                        style={[Styles.ffMbold, Styles.f14, Styles.cBlk,{width:winW/1.7}]}>{_.startCase(list.customer_firstname)} {_.startCase(list.customer_lastname)}</Text>
                                                                </View>
                                                        </View>
                                                        <MaterialIcons name="chevron-right"
                                                                       size={30}/>
                                                    </View>

                                                    {
                                                        list.status === "READY_FOR_PICKUP"
                                                            ?
                                                            <View style={[Styles.row, Styles.jSpaceBet, Styles.mTop5,Styles.marH1,Styles.mBtm1]}>


                                                                <View style={[Styles.row, Styles.jSpaceBet]}>
                                                                    <TouchableOpacity
                                                                        activeOpacity={0.5}
                                                                        onPress={() => {
                                                                            this.setState({
                                                                                selectedOrderId: list.id,
                                                                                // swipeActivated: true,
                                                                                Button: 'SINGLE_REJECT',
                                                                                rejectReasonModal: true
                                                                            })
                                                                        }}
                                                                        style={[Styles.aslCenter, Styles.bgWhite, Styles.bw1, Styles.bcRed,{width:winW/2.1}]}>
                                                                        <Text
                                                                            style={[Styles.ffMbold, Styles.cRed, Styles.aslCenter, Styles.f14, Styles.p5]}>REJECT</Text>
                                                                    </TouchableOpacity>

                                                                    <TouchableOpacity
                                                                        activeOpacity={0.5}
                                                                        onPress={() => {
                                                                            this.setState({
                                                                                selectedOrderId: list.id,
                                                                                swipeActivated: true,
                                                                                Button: 'SINGLE_START',
                                                                            }, () => {
                                                                                this.validatingLocation()
                                                                            })
                                                                        }}
                                                                        style={[Styles.aslCenter, Styles.bgWhite, Styles.bw1,{marginLeft:1}, Styles.bcGreen,{width:winW/2.1}]}>
                                                                        <Text
                                                                            style={[Styles.ffMbold, Styles.colorGreen, Styles.aslCenter, Styles.f14, Styles.p5]}>PICK
                                                                            UP</Text>
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </View>
                                                            :
                                                            null
                                                    }


                                                </View>


                                                </View>


                                            </TouchableOpacity>
                                            {
                                                list.status === "READY_FOR_PICKUP" && list.pickUpAddress
                                                    ?
                                                    <View style={[Styles.mBtm5]}>
                                                        <View style={[Styles.row, Styles.jSpaceArd]}>
                                                            <View style={[Styles.aslCenter, {
                                                                borderStyle: 'dotted',
                                                                borderWidth: 1,
                                                                // borderRadius: 1,
                                                                borderColor:'#b2beb5',
                                                                width: 1, height: 5,
                                                            }]}/>
                                                            <View style={[Styles.aslCenter, {
                                                                borderStyle: 'dotted',
                                                                borderWidth: 1,
                                                                // borderRadius: 1,
                                                                borderColor:'#b2beb5',
                                                                width: 1, height: 5,
                                                            }]}/>
                                                            <View style={[Styles.aslCenter, {
                                                                borderStyle: 'dotted',
                                                                borderWidth: 1,
                                                                // borderRadius: 1,
                                                                borderColor:'#b2beb5',
                                                                width: 1, height: 5,
                                                            }]}/>
                                                        </View>
                                                        <View
                                                            style={[Styles.bgWhite, Styles.OrdersScreenCardshadow, Styles.p5]}>
                                                            <View style={[Styles.row, Styles.jSpaceBet]}>
                                                                <View/>
                                                                <Text
                                                                    style={[Styles.ffMregular, Styles.f16, Styles.cBlk, Styles.aslCenter]}>Navigate to pick-up address</Text>
                                                                <MaterialIcons name="navigation"
                                                                               size={24}
                                                                               color={'#fff'}
                                                                               // onPress={() => Linking.openURL('google.navigation:q=18.0072+79.5584')}
                                                                               onPress={() =>{
                                                                                   const location = list.pickUpAddress.location;
                                                                                   // Linking.openURL('google.navigation:q=18.0072+79.5584')
                                                                                   if(location){
                                                                                       Linking.openURL('google.navigation:q='+location.latitude+'+'+location.longitude)
                                                                                   }else{
                                                                                       Utils.dialogBox('No Locations Found','');
                                                                                   }}}
                                                                               style={[Styles.p3, Styles.bgDBlue, Styles.br5, Styles.jEnd]}/>
                                                            </View>
                                                        </View>
                                                    </View>
                                                    :
                                                    null
                                            }

                                        </View>
                                    </View>
                                    </View>
                                )
                            },)
                            :
                            <Text
                                style={[Styles.ffMbold, Styles.aslCenter, Styles.padV30, Styles.f18, Styles.cBlk]}>No
                                Orders added to you.</Text>
                    }
                </ScrollView>
                {
                    this.state.selectedOrderList.length > 0
                        ?
                        <View style={[Styles.bgLGreen]}>
                            <Text
                                style={[Styles.ffMbold, Styles.aslCenter, Styles.padV10, Styles.f18, Styles.cBlk]}>{'Selected' + '(' + this.state.selectedOrderList.length + ')'}</Text>
                            <View style={[Styles.row, Styles.jSpaceArd, Styles.p10]}>
                                <TouchableOpacity
                                    onPress={() => this.setState({Button: 'MULTIPLE_REJECT', swipeActivated: true,rejectReasonModal:true})}
                                    style={[Styles.aslCenter, Styles.br5, {backgroundColor: 'red'},Styles.width120]}>
                                    <Text
                                        style={[Styles.ffMbold, Styles.aslCenter, Styles.padH10, Styles.padV10, Styles.f18, Styles.cWhite]}>REJECT</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => this.setState({Button: 'MULTIPLE_ACCEPT', swipeActivated: true}, () => {
                                        this.validatingLocation()
                                    })}
                                    style={[Styles.aslCenter, Styles.br5, Styles.bgGrn,Styles.width120]}>
                                    <Text
                                        style={[Styles.ffMbold, Styles.cWhite, Styles.aslCenter, Styles.padH10, Styles.padV10, Styles.f18]}>ACCEPT</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        :
                        null
                }

                {/*Modal for REJECT USER*/}
                <Modal
                    transparent={true}
                    visible={this.state.rejectReasonModal}
                    animationType='fade'
                    onRequestClose={() => {
                        // this.setState({rejectReasonModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({showRejectUserModal: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        {  this.state.spinnerBool === false  ?  null  :  <CSpinner/>  }
                        <View
                            style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br15, Styles.mBtm20, {
                                width: Dimensions.get('window').width - 40,
                                height: Dimensions.get('window').height / 2
                            }]}>

                                <ScrollView style={[Styles.marH15]}>

                                    <View>
                                        <View style={[Styles.row,Styles.aslCenter, Styles.marV10]}>
                                            <Text style={[Styles.f18, Styles.cBlk, Styles.ffMbold, Styles.aslCenter]}>Reject Reason</Text>
                                        </View>
                                        <TextInput
                                            textAlignVertical={'top'}
                                            style={[Styles.marV5, Styles.bw1, Styles.bcAsh,Styles.cBlk, Styles.f16,Styles.br5,Styles.p5,{height:180}]}
                                            placeholder='Enter reject reason'
                                            multiline={true}
                                            autoCompleteType='off'
                                            autoCapitalize="none"
                                            blurOnSubmit={false}
                                            value={this.state.rejectReason}
                                            onSubmitEditing={() => {
                                                Keyboard.dismiss()
                                            }}
                                            onChangeText={(rejectReason) => this.setState({rejectReason}, () => {
                                                let resp = {};
                                                resp = Utils.isValidRejectReason(this.state.rejectReason);
                                                if (resp.status === true) {
                                                    this.setState({errorRejectReason: null});
                                                } else {
                                                    this.setState({errorRejectReason: resp.message});
                                                }
                                            })}/>
                                        {
                                            this.state.errorRejectReason ?
                                                <Text style={{
                                                    color: 'red',
                                                    fontFamily: 'Muli-Regular',
                                                    paddingLeft: 20, marginBottom: 10
                                                }}>{this.state.errorRejectReason}</Text>
                                                :
                                                null
                                        }
                                    </View>

                                </ScrollView>
                            <View style={[Styles.row, Styles.jSpaceArd, Styles.p10]}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => this.setState({rejectReasonModal: false, swipeActivated: false,rejectReason:'',errorRejectReason: null})}
                                    style={[Styles.aslCenter, Styles.br5,Styles.bgBlk,Styles.width120]}>
                                    <Text
                                        style={[Styles.ffMbold, Styles.aslCenter,Styles.padH5,Styles.padV10, Styles.f18, Styles.cWhite]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        let resp = {};
                                        resp = Utils.isValidRejectReason(this.state.rejectReason);
                                        if (resp.status === true) {
                                            this.setState({errorRejectReason: null,swipeActivated: true,},()=>{
                                                this.validatingLocation()
                                            });
                                        } else {
                                            this.setState({errorRejectReason: resp.message});
                                        }
                                    }}
                                    style={[Styles.aslCenter, Styles.br5, Styles.bgDarkRed,Styles.width120]}>
                                    <Text
                                        style={[Styles.ffMbold, Styles.cWhite,Styles.padH10,Styles.padV10, Styles.aslCenter,Styles.f18]}>Reject</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                    </View>

                </Modal>

            </View>
        );
    }
}

