import React from 'react';
import {
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Linking, PermissionsAndroid, Alert, FlatList
} from 'react-native';
import {Styles, CSpinner, CText} from '../common'
import Utils from "../common/Utils";
import Config from "../common/Config";
import Services from "../common/Services";
import {
    Appbar,
    Card,
    DefaultTheme,
} from "react-native-paper";
import OfflineNotice from '../common/OfflineNotice';
import OneSignal from "react-native-onesignal";
import HomeScreen from "../HomeScreen";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
// import SwipeButton from "rn-swipe-button";
import Geolocation from "react-native-geolocation-service";
import RNAndroidLocationEnabler from "react-native-android-location-enabler";
import {Column as Col, Row} from "react-native-flexbox-grid";
import _ from "lodash";
import {CheckBox} from "react-native-elements";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";


const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};
export default class OrdersStartScreen extends React.Component {

    constructor(props) {
        super(props);
        this.props.navigation.addListener(
            'didFocus',() => {
                OneSignal.addEventListener('received', HomeScreen.prototype.onReceived);
                OneSignal.addEventListener('opened',HomeScreen.prototype.onOpened.bind(this));
            }
        );
        this.props.navigation.addListener(
            'willBlur',() => {
                OneSignal.removeEventListener('received', HomeScreen.prototype.onReceived);
                OneSignal.removeEventListener('opened',HomeScreen.prototype.onOpened.bind(this));
            }
        );
        this.state = {
            spinnerBool:false,
            orderData:[],
           cashCollected:'0',
            currentLocation: [],
            // latitude: null,
            // longitude: null,
            GPSasked:false,swipeActivated:false,showOrderItemsList:true,
        };
    }

    componentDidMount() {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            this.requestLocationPermission();
            const orderList = self.props.navigation.state.params.orderData;
            self.setState({  orderData: orderList,orderItems:orderList.orderItems   },()=>{
                 const tempList = orderList.orderItems;
                if (tempList.length === 0) {
                    self.setState({showOrderItemsList:false})
                }
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

    checkGPSpermission(){
        RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({interval: 10000, fastInterval: 5000})
            .then(data => {
                this.setState({GPSasked:true},()=>{
                    this.requestLocationPermission()
                })
            }).catch(err => {
            Utils.dialogBox('GPS permissions denied', '');
            this.props.navigation.goBack()
        });
    }

    validatingLocation() {
        // console.log('Location validation start order', this.state.longitude, this.state.latitude)
        if (this.state.longitude  && this.state.latitude ) {
            let tempBody ={}
            const latitude =this.state.latitude;
            const longitude =this.state.longitude;
            tempBody.location = {"latitude": latitude, "longitude": longitude}
            if (this.state.swipeActivated === true){
                this.startOrder(tempBody)
            }
        } else {
            Alert.alert('','Your Location data is missing,Please check your Location Settings',
                [ {
                    text: 'enable', onPress: () => {this.requestLocationPermission();}
                }]);
        }
    }

    //API CALL to START ORDER
    startOrder = (body) => {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.START_ORDER;
        body.id = this.state.orderData.id
        // console.log('START SCREEN start Order apiURL====', apiURL,'body==',body);
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "PUT", body, function (response) {
                if (response.status === 200) {
                    // console.log('start screen Order rep200====', response.data);
                     self.setState({spinnerBool: false} )
                    self.props.navigation.goBack()
                }
            }, function (error) {
                self.errorHandling(error);
            })
        });
    };



    swipeOrderStartShift(statusCheck) {
        return (
        <TouchableOpacity onPress={() => {
            Services.returnCurrentPosition((position)=>{
                this.setState({
                    currentLocation: position,
                    latitude: position.latitude,
                    longitude: position.longitude,
                    swipeActivated:true
                },()=>{this.validatingLocation()})
            })
            // this.setState({swipeActivated:true},()=>{    this.validatingLocation()  })
        }}
                          style={[Styles.br5, {  backgroundColor: statusCheck ? '#b2beb5' :'#36A84C'  }]}
                          disabled={statusCheck}>
            <Text style={[Styles.cWhite, Styles.f20, Styles.p10, Styles.aslCenter, Styles.ffMregular]}>PICKUP ORDER</Text>
        </TouchableOpacity>
        )
    }

    //cashCollected validate
    CashCollectedValidate(cash) {
        cash = cash.replace('-', '').replace(/[&\/\\#,+()$~%!@^a-zA-Z_=.'":*?<>{}]/g, '').replace(/\s+/g, '');

        if (cash > 300000) {
            this.setState({cashCollected: '300000'})
            Utils.dialogBox('Maximum Value is 300000', '');
        } else if (cash < 0) {
            this.setState({cashCollected: '0'})
            // Utils.dialogBox('Minimum Value is 0', '');
        } else {
            this.setState({cashCollected: cash})
        }
    }


    render() {
        const {orderData} = this.state;
         return (
            <View style={[[Styles.flex1, Styles.bgWhite]]}>
                {this.renderSpinner()}
                <OfflineNotice/>
                {
                    orderData
                    ?
                        <View style={[[Styles.flex1, Styles.bgDWhite]]}>

                            <View style={[Styles.bgDarkRed,Styles.AuthScreenHeadershadow]}>
                                <Appbar.Header theme={theme} style={Styles.bgDarkRed}>
                                    <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                                    <Appbar.Content title={ orderData.siteCode ? orderData.siteCode + ' - ' : '' + orderData.orderId } titleStyle={[Styles.ffMbold]}/>
                                </Appbar.Header>
                            </View>

                            {/*<View>*/}
                            {/*    <View style={[Styles.ordersStatusPositionAbs]}>*/}
                            {/*    </View>*/}
                            {/*    <View style={[Styles.row, Styles.p15, Styles.jSpaceBet,]}>*/}
                            {/*        <View >*/}
                            {/*            <MaterialIcons name="timer" size={30} color="#b2beb5" style={[Styles.aslCenter,Styles.p5,Styles.bgDash]} />*/}
                            {/*             <Text>Accepted</Text>*/}
                            {/*        </View>*/}
                            {/*        <View style={[Styles.aslCenter]}>*/}
                            {/*            <MaterialIcons name="timer" size={30} color="#b2beb5" style={[Styles.aslCenter,Styles.p5,Styles.bgDash]} />*/}
                            {/*            <Text>Arriving</Text>*/}
                            {/*        </View>*/}
                            {/*        <View pointerEvents="none">*/}
                            {/*            <MaterialIcons name="timer" size={30} color="#b2beb5" style={[Styles.aslCenter,Styles.p5,Styles.bgDash]} />*/}
                            {/*            <Text>Delivered</Text>*/}
                            {/*        </View>*/}
                            {/*    </View>*/}
                            {/*</View>*/}


                            <ScrollView
                                persistentScrollbar={true}
                                style={[Styles.flex1,Styles.bgDWhite]}>

                                <View style={[Styles.m10,Styles.bgWhite]}>
                                    <View style={[Styles.row, Styles.jSpaceBet]}>
                                        <Text style={[Styles.f16, Styles.ffMbold,]}>Order Details
                                            : {this.state.orderData.itemQuantity} Items</Text>
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
                                            <View style={[Styles.flex1,Styles.aitCenter]}>
                                                <Row size={12} nowrap
                                                     style={[Styles.row, Styles.padV10, Styles.alignCenter,Styles.bgOrangeYellow]}>
                                                    <Col sm={6}>
                                                        <Text
                                                            style={[Styles.ffMextrabold, Styles.f16, Styles.aslCenter]}>Item Name</Text>
                                                    </Col>
                                                    <Col sm={3}>
                                                        <Text
                                                            style={[Styles.ffMextrabold, Styles.f16, Styles.aslCenter]}>Price (<FontAwesome name="inr" size={14} color="#000"/>)</Text>
                                                    </Col>
                                                    <Col sm={3}>
                                                        <Text
                                                            style={[Styles.ffMextrabold, Styles.f16, Styles.aslCenter]}>Quantity</Text>
                                                    </Col>
                                                </Row>
                                                <View style={[Styles.row, Styles.aslCenter,Styles.bgRed]}>
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
                                                                        <Col sm={6}>
                                                                            <Text  style={[Styles.ffMbold,Styles.cBlk, Styles.f14, {textAlignVertical: 'center'}]}>{_.startCase(item.name) || '---'}</Text>
                                                                        </Col>
                                                                        <Col sm={3}>
                                                                            <Text  style={[Styles.ffMbold,Styles.cBlk, Styles.f14,Styles.aslCenter]}>{item.price}</Text>
                                                                        </Col>
                                                                        <Col sm={3}>
                                                                                    <Text  style={[Styles.ffMbold,Styles.cBlk, Styles.f14,Styles.aslCenter]}>{item.itemQuantity}</Text>
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
                                    orderData.address
                                        ?
                                        <View style={[Styles.p10, Styles.flex1]}>
                                           <View style={[Styles.bgWhite,Styles.OrdersScreenCardshadow,Styles.padH10,Styles.padV5]}>
                                               <Text
                                                   style={[Styles.ffMextrabold, Styles.alignCenter, Styles.f16, Styles.padV3,Styles.cBlk]}>Customer Contact:</Text>
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

                                            <View style={[Styles.bgWhite,Styles.OrdersScreenCardshadow,Styles.padH10,Styles.padV5,Styles.mTop10]}>
                                                <Text
                                                    style={[Styles.ffMbold, Styles.alignCenter, Styles.f16, Styles.padV3,Styles.cBlk]}>Delivery Address:</Text>
                                                <View style={[Styles.row,Styles.jSpaceBet]}>
                                                    <View>
                                                        <Text style={[Styles.ffMregular, Styles.f16,Styles.flexWrap,Styles.cBlk]}>{orderData.address.streetAddress},</Text>
                                                        {
                                                            orderData.address.city
                                                                ? <Text
                                                                    style={[Styles.ffMregular, Styles.f14,Styles.cBlk]}>{orderData.address.city},</Text> : null
                                                        }
                                                        <Text style={[Styles.ffMregular, Styles.f16,Styles.cBlk]}>{orderData.address.region}-{orderData.address.postcode}</Text>
                                                    </View>
                                                    <View style={[Styles.aslCenter]}>
                                                        <MaterialIcons name="navigation"
                                                                       size={30}
                                                                       color={'#fff'}
                                                                       onPress={() =>{
                                                                           const location = orderData.address.location;
                                                                           if(location){
                                                                               Linking.openURL('google.navigation:q='+location.latitude+'+'+location.longitude)
                                                                           }else{
                                                                               Utils.dialogBox('No Locations Found','');
                                                                           }}}
                                                                       style={[Styles.p3,Styles.bgGrn72,Styles.br5,Styles.aslCenter]}/>
                                                    </View>
                                                </View>
                                            </View>

                                            {/*<View style={[Styles.row, Styles.jSpaceBet]}>*/}
                                            {/*    <View style={[Styles.flex1]}>*/}
                                            {/*        <Text style={[Styles.ffMbold, Styles.f16,Styles.flexWrap]}>{this.state.orderData.address.streetAddress},</Text>*/}
                                            {/*        {*/}
                                            {/*               this.state.orderData.address.city*/}
                                            {/*                ? <Text*/}
                                            {/*                    style={[Styles.ffMbold, Styles.f14]}>{this.state.orderData.address.city},</Text> : null*/}
                                            {/*        }*/}
                                            {/*        <Text style={[Styles.ffMbold, Styles.f16]}>{this.state.orderData.address.region}-{this.state.orderData.address.postcode}</Text>*/}
                                            {/*    </View>*/}
                                            {/*    <MaterialIcons name="navigation" size={25} color="black"*/}
                                            {/*                   style={[Styles.aslCenter, Styles.p5]}*/}
                                            {/*                   onPress={() =>{*/}
                                            {/*                       const location = this.state.orderData.location;*/}
                                            {/*                       if(location){*/}
                                            {/*                           Linking.openURL('google.navigation:q='+location.latitude+'+'+location.longitude)*/}
                                            {/*                           // Linking.openURL('google.navigation:q=18.0072+79.5584')*/}
                                            {/*                           // Linking.openURL(url)*/}
                                            {/*                       }else{*/}
                                            {/*                           Utils.dialogBox('No Locations Found','');*/}
                                            {/*                       }}*/}
                                            {/*                   }/>*/}
                                            {/*</View>*/}
                                            <View style={[Styles.bgWhite,Styles.OrdersScreenCardshadow,Styles.padH10,Styles.mTop10]}>
                                                {
                                                    orderData.slot
                                                        ?
                                                        <View>
                                                            <View style={[Styles.padV5, Styles.mTop5]}>
                                                                <Text style={[Styles.ffMbold, Styles.f16]}>ETA,</Text>
                                                                <Text style={[Styles.ffMregular, Styles.f16]}>{orderData.estimatedTimeOfArrival ? orderData.estimatedTimeOfArrival : '--'}</Text>
                                                            </View>
                                                            <View style={[Styles.padV5]}>
                                                                <Text style={[Styles.ffMbold, Styles.f16]}>Customer Delivery Slot,</Text>
                                                                <Text style={[Styles.ffMregular, Styles.f16]}>{Services.returnHMformatFromTimeStamp(orderData.slot.startTime)}-{Services.returnHMformatFromTimeStamp(orderData.slot.endTime)},{new Date(orderData.slot.startTime).toDateString()}</Text>
                                                            </View>
                                                        </View>
                                                        :
                                                        null
                                                }

                                                <View style={[Styles.padV5, Styles.flexWrap]}>
                                                    <Text style={[Styles.ffMbold, Styles.f16]}>Order
                                                        Amount:  <FontAwesome name="inr" size={16} color="#000" style={[Styles.aslCenter]}/> {this.state.orderData.payment.amount_ordered} ({orderData.paymentType === "COD" ? 'Cash on Delivery': 'Prepaid'}) </Text>
                                                </View>
                                            </View>


                                        </View>
                                        :
                                        null
                                }



                            </ScrollView>
                            {
                                orderData.status
                                    ?
                                     // FOOTER BUTTON
                                    <Card style={[Styles.footerUpdateButtonStyles]}>
                                        {this.swipeOrderStartShift(false)}
                                    </Card>
                                :
                                null
                            }


                        </View>
                        :
                       <CSpinner/>
                }

            </View>
        );
    }
}

