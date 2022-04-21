import React, {Component} from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    Dimensions,
    Modal,
    ScrollView, FlatList, ActivityIndicator, RefreshControl
} from 'react-native';
import {CButton, CInput, CText, CModal, Styles, CSpinner} from './common'
import Utils from "./common/Utils";
import {
    Appbar,
    Surface,
    DefaultTheme,
    Provider as PaperProvider,
    Card,
    Title,
    List,
    Paragraph
} from "react-native-paper";
import {Row} from "react-native-flexbox-grid";
import Services from "./common/Services";
import Config from "./common/Config";
import Icon from 'react-native-vector-icons/dist/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/dist/FontAwesome';
import _  from 'lodash';
import OfflineNotice from './common/OfflineNotice';
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";



const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};
export default class DeliveriesHistory extends Component {

    constructor(props) {
        super(props);
        this.props.navigation.addListener(
            'willBlur',() => {
                OneSignal.removeEventListener('received', HomeScreen.prototype.onReceived);
                OneSignal.removeEventListener('opened',HomeScreen.prototype.onOpened.bind(this));
            }
        );

        this.props.navigation.addListener(
            'didFocus',() => {
                OneSignal.addEventListener('received', HomeScreen.prototype.onReceived);
                OneSignal.addEventListener('opened',HomeScreen.prototype.onOpened.bind(this));
            }
        );
        this.state = {showPackagesListModal: false, showPackages: false,
            showDuration: false, spinnerBool: false, ascendingOrder:true,
            refreshing: false};
    }

    componentDidMount(): void {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        })
        self.getAllDeliveries();
    };

    onRefresh() {
        //Clear old data of the list
        this.setState({dataSource: []});
        //Call the Service to get the latest data
        this.getAllDeliveries();
    }

    errorHandling(error) {
        // console.log("screen error", error, error.response);
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

    getAllDeliveries() {
        const self = this;
        const getPackages = Config.routes.BASE_URL + Config.routes.GET_TRIPS;
        const body = JSON.stringify({});
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(getPackages, "POST", body, function (response) {
                if (response.status === 200) {
                    const packagesData = response.data;
                    self.setState({packagesData: packagesData.content, spinnerBool: false, refreshing: false} )
                }
            },function (error) {
                self.errorHandling(error)
            });
         })
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    packagesList(item) {
        return (
            <View style={[Styles.bcAsh, {marginBottom: 15}]}>
                <View style={[Styles.bgWhite]}>
                    <View style={{backgroundColor: '#fff', elevation: 1}}>
                        <View style={[{backgroundColor: '#fff'}, Styles.row, Styles.jSpaceBet]}>
                            <View style={[Styles.row, Styles.jSpaceBet]}>
                                <View style={styles.dHistoryGridOne}>
                                    <CText cStyle={[styles.dHistoryGridSub, {fontSize:19}]}>{item.totalDeliveries}</CText>
                                    <CText cStyle={[{fontFamily: 'Muli-Regular', textAlign: 'center'}]}>packages</CText>
                                </View>
                                <View style={styles.dHistoryGridTwo}>
                                    <CText cStyle={[styles.dHistoryGridSub, {fontSize:18}]}>{item.durationStr} ({(item.expectedDuration)/60}h)</CText>
                                    <CText cStyle={[{fontFamily: 'Muli-Regular', textAlign: 'center'}]}>{item.attrs.shiftDate}</CText>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => this.setState({showPackagesListModal: true, deliveriesData: item},()=>{
                                    this.getAllTypesOfPackages(item);
                                })}>
                                <Text style={{fontFamily: 'Muli-Light', padding:26, alignSelf: 'flex-end'}}>
                                    <Icon name="info-outline" size={45} color={'#909090'}/>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        )
    }

    showOrHidePackages(data) {
        if (data === true) {
            this.setState({showPackages: true})
        } else {
            this.setState({showPackages: false})
        }
    }

    sortingFilter(sortType){
        if(sortType === "ascending") {
            const filteredData = _.sortBy(this.state.packagesData, function (data) {
                return new Date(data.shiftDate);
            });
            this.setState({packagesData: filteredData, ascendingOrder: false})
        }else{
            const filteredData = _.sortBy(this.state.packagesData, function (data) {
                return new Date(data.shiftDate);
            });
            filteredData.reverse();
            this.setState({packagesData: filteredData, ascendingOrder: true})
        }
    }

    ShiftTimings(item) {
        var timeHours = new Date(item).getHours();
        var timeMinutes = new Date(item).getMinutes();
        return (
            <Title style={{
                fontSize: 18,
                textAlign: 'center',
                fontFamily: 'Muli-Bold'
            }}>{timeHours <= 9 ? ('0' + timeHours) : (timeHours)}:{timeMinutes <= 9 ? ("0" + timeMinutes) : timeMinutes}</Title>
        )
    }

    //Will form an array with pickup and delivery packages
    getAllTypesOfPackages = (item) => {
         const packagesData = item;
        const deliveryPackages = packagesData.deliveredPackagesInfo; //data from params
        // const pickupPackages = [{type: "C-Returns", count: 4},{type: "MFN", count: 4},{type: "P2P", count: 5}];
        const pickupPackages = packagesData.pickUpPackagesInfo; //data from API
         const EndShiftArray = [];
        if (pickupPackages && deliveryPackages) {
            for (var i = 0; i < pickupPackages.length; i++) {
                for (var j = 0; j < deliveryPackages.length; j++) {
                    if (pickupPackages[i].type === deliveryPackages[j].type) {
                        let sample = {};
                        sample.type = pickupPackages[i].type;
                        sample.pickupCount = pickupPackages[i].count;
                        sample.deliveryCount = deliveryPackages[j].count;
                        EndShiftArray.push(sample);
                    }
                }
            }
        }
        this.setState({deliveryHistory: EndShiftArray});
    };

    FetchFinalCount(item) {
         return (
            <View style={styles.inline}>
                <Text style={{
                    fontFamily: 'Muli-Regular',
                    fontSize: 18
                }}>{item.type}</Text>
                <Text style={{fontFamily: 'Muli-Bold', fontSize: 20}}>
                    {item.deliveryCount}/{item.pickupCount}</Text>
            </View>
        )
    }


    render() {
        if (this.state.refreshing) {
            return (
                //loading view while data is loading
                <View style={[Styles.flex1, Styles.alignCenter]}>
                    <ActivityIndicator/>
                </View>
            );
        }
        return (
            <View style={[Styles.flex1, {backgroundColor: "#f1f5f4"}]}>
                <OfflineNotice/>
                <Appbar.Header theme={theme} style={Styles.bgWhite}>
                    {/*<Appbar.BackAction onPress={() => this.props.navigation.goBack()}*/}
                    {/*/>*/}
                    <Appbar.Action onPress={() => {
                        this.props.navigation.openDrawer()
                    }} icon="menu"/>
                    <Appbar.Content
                        title="Your Deliveries"
                        subtitle=""
                    />
                    {
                        this.state.ascendingOrder ?
                            <Appbar.Action icon="filter-list" onPress={()=> this.sortingFilter('ascending')}/>:
                            <Appbar.Action icon="filter-list" onPress={()=> this.sortingFilter('descending')}/>
                    }

                    {/*<Appbar.Action icon="search"/>*/}
                    {/*<Appbar.Action icon="more-horiz"/>*/}
                </Appbar.Header>


                <Modal
                    transparent={true}
                    visible={this.state.showPackagesListModal}
                    onRequestClose={() => {
                        this.setState({ showPackagesListModal: false, showPackages: false })
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({showPackagesListModal: false, showPackages: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        <View style={[Styles.bgWhite, {
                            width: Dimensions.get('window').width - 30,
                            height: Dimensions.get('window').height - 60,
                            fontFamily: 'Muli-Regular',
                        }]}>
                            {
                                this.state.deliveriesData
                                    ?
                                    <View style={{margin:5}}>
                                        <View style={{padding:10}}>
                                        <View style={[Styles.row, Styles.jSpaceBet, {fontSize: 20}]}>
                                            <Text style={{
                                                fontSize: 20,
                                                fontFamily: 'Muli-Bold',
                                                color: '#000'
                                            }}>Summary</Text>
                                            <Text style={{fontSize: 18, fontFamily: 'Muli-Light'}}>
                                                {new Date(this.state.deliveriesData.shiftDate).toDateString()}
                                            </Text>
                                        </View>
                                        <Text style={{
                                            fontFamily: 'Muli-Regular',
                                            fontSize: 16,
                                            paddingBottom: 10,
                                            marginTop: 10
                                        }}>
                                            Reported at <Text style={{fontFamily: 'Muli-Bold'}}>
                                            {this.state.deliveriesData.attrs.siteName}
                                            ({this.state.deliveriesData.attrs.clientName}) {'\n'}
                                            {this.state.deliveriesData.clientUserIdInfo === null
                                                ? null
                                                : this.state.deliveriesData.clientUserIdInfo.clientUserId}</Text>
                                        </Text>
                                        </View>

                                        <ScrollView style={{height: Dimensions.get('window').height / 1.6}}>
                                            <Card theme={theme}
                                                  style={[Styles.marH10, {marginTop: 1, borderRadius: 0}]}>
                                                <Card.Content
                                                    style={[Styles.row, Styles.jSpaceBet, {fontSize: 18}]}>
                                                    <Title style={{fontSize: 18}}>Duration</Title>
                                                    <Title></Title>
                                                    <Title style={{
                                                        fontFamily: 'Muli-Bold',
                                                        fontSize: 18
                                                    }}>{this.state.deliveriesData.durationStr}({(this.state.deliveriesData.expectedDuration)/60}h)</Title>
                                                </Card.Content>
                                            </Card>
                                            <View
                                                style={[Styles.row,  Styles.marH10, Styles.alignCenter]}>
                                                <Card theme={theme}
                                                      style={[Styles.flex1,Styles.alignCenter, {
                                                          borderRadius: 0,
                                                          marginVertical: 1,
                                                          marginRight: 1,
                                                          padding:5
                                                      }]}>
                                                    <Text style={[Styles.f16,Styles.cBlk,Styles.ffMregular]}>{this.ShiftTimings(this.state.deliveriesData.reportingTime)}({this.state.deliveriesData.startTime.hours <= 9
                                                        ? "0" + this.state.deliveriesData.startTime.hours : this.state.deliveriesData.startTime.hours}:{this.state.deliveriesData.startTime.minutes <= 9
                                                        ? "0" + this.state.deliveriesData.startTime.minutes : this.state.deliveriesData.startTime.minutes})
                                                    </Text>
                                                </Card>
                                                <Card theme={theme} style={[Styles.flex1,Styles.alignCenter,  {
                                                    borderRadius: 0,
                                                    marginVertical: 1,
                                                    padding:5
                                                }]}>
                                                    <Text style={[Styles.f16,Styles.cBlk,Styles.ffMregular]}>{this.ShiftTimings(this.state.deliveriesData.actualEndTime)}({this.state.deliveriesData.endTime.hours <= 9
                                                        ? "0" + this.state.deliveriesData.endTime.hours : this.state.deliveriesData.endTime.hours}:{this.state.deliveriesData.endTime.minutes <= 9
                                                        ? "0" + this.state.deliveriesData.endTime.minutes : this.state.deliveriesData.endTime.minutes})
                                                    </Text>
                                                </Card>

                                            </View>
                                            {
                                                //Ododmeter reading for everyone, Except Assocaite and Labour
                                                this.state.deliveriesData.userRole === 1 || this.state.deliveriesData.userRole >= 15
                                                    ?
                                                    null
                                                    :
                                                    <View style={{marginTop: 5, marginBottom: 5}}>
                                                        <Card theme={theme}
                                                              style={[Styles.marH10, {marginTop: 5, borderRadius: 0}]}>
                                                            <Card.Content
                                                                style={[Styles.row, Styles.jSpaceBet, {fontSize: 18}]}>
                                                                <Title style={{fontSize: 18}}>Trip</Title>
                                                                <Title></Title>
                                                                <Title style={{fontFamily: 'Muli-Bold', fontSize: 18}}>
                                                                    {this.state.deliveriesData.endOdometerReading - this.state.deliveriesData.startOdometerReading}
                                                                    km</Title>
                                                            </Card.Content>
                                                        </Card>
                                                        <View
                                                            style={[Styles.row, Styles.jSpaceBet, Styles.marH10, Styles.alignCenter]}>
                                                            <Card theme={theme}
                                                                  style={[Styles.flex1, {
                                                                      borderRadius: 0,
                                                                      marginVertical: 1,
                                                                      marginRight: 1
                                                                  }]}>
                                                                <Card.Content>
                                                                    <Title style={{
                                                                        fontSize: 18,
                                                                        textAlign: 'center',
                                                                        fontFamily: 'Muli-Bold'
                                                                    }}>{this.state.deliveriesData.startOdometerReading}</Title>
                                                                </Card.Content>

                                                            </Card>
                                                            <Card theme={theme}
                                                                  style={[Styles.flex1, {
                                                                      borderRadius: 0,
                                                                      marginVertical: 1,
                                                                      textAlign: 'center'
                                                                  }]}>
                                                                <Card.Content>
                                                                    <Title style={{
                                                                        fontSize: 18,
                                                                        textAlign: 'center',
                                                                        fontFamily: 'Muli-Bold'
                                                                    }}>{this.state.deliveriesData.endOdometerReading}</Title>
                                                                </Card.Content>
                                                            </Card>

                                                        </View>
                                                    </View>

                                            }

                                            {
                                                //CashCollected For Everyone, Except Driver and Labour
                                                this.state.deliveriesData.userRole === 5 || this.state.deliveriesData.userRole >= 15
                                                    ?
                                                    null
                                                    :
                                                    <View>
                                                        <Card theme={theme}
                                                              style={[Styles.marH10, {marginTop: 5, borderRadius: 0}]}>
                                                            <Card.Content
                                                                style={[Styles.row, Styles.jSpaceBet, {fontSize: 18}]}>
                                                                <Title style={{fontSize: 18}}>Cash Collected</Title>
                                                                <Title></Title>
                                                                <Title style={{
                                                                    fontFamily: 'Muli-Bold',
                                                                    fontSize: 18
                                                                }}> <FontAwesome name="inr"
                                                                                 size={20}/> {this.state.deliveriesData.cashCollected}
                                                                </Title>
                                                            </Card.Content>
                                                        </Card>
                                                    </View>
                                            }

                                            {
                                                //packages For Everyone, Except Driver and Labour
                                                this.state.deliveriesData.userRole === 5 || this.state.deliveriesData.userRole >=15
                                                    ?
                                                    null
                                                    :
                                                    <TouchableOpacity
                                                        onPress={() => this.showOrHidePackages(!this.state.showPackages)}>
                                                        <Card theme={theme}
                                                              style={[Styles.marV10, Styles.marH10, {
                                                                  borderRadius: 0,
                                                                  backgroundColor: this.state.showPackages === true ? '#ccc' : '#fff'
                                                              }]}>
                                                            <Card.Content
                                                                style={[Styles.row, Styles.jSpaceBet, {fontSize: 18}]}>
                                                                <Title style={{fontSize: 18}}>Packages</Title>
                                                                <Title></Title>
                                                                <Title style={{
                                                                    fontSize: 18,
                                                                    fontFamily: 'Muli-Bold'
                                                                }}>{this.state.deliveriesData.deliveredPackagesCount}/{this.state.deliveriesData.pickUpPackagesCount}</Title>
                                                            </Card.Content>
                                                        </Card>
                                                    </TouchableOpacity>
                                            }
                                            {
                                                //Packages Details,will show only after showPackages is true
                                                this.state.showPackages === true ?
                                                    <View style={{paddingHorizontal: 20}}>
                                                        <FlatList
                                                            style={[]}
                                                            data={this.state.deliveryHistory}
                                                            renderItem={({item}) => this.FetchFinalCount(item)}
                                                            extraData={this.state}
                                                            keyExtractor={(item, index) => index.toString()}/>
                                                    </View>
                                                    : null
                                            }
                                        </ScrollView>
                                        <TouchableOpacity style={[Styles.marV5]} onPress={() => {
                                            this.setState({showPackagesListModal: false})
                                        }}>
                                            <Card.Title theme={theme}
                                                        titleStyle={[Styles.f16, Styles.ffMregular, Styles.aslCenter]}
                                                        title='tap to dismiss'/>
                                        </TouchableOpacity>
                                    </View>
                                    : null
                            }

                        </View>
                    </View>
                </Modal>
                {this.renderSpinner()}
                <ScrollView refreshControl={
                    <RefreshControl
                        //refresh control used for the Pull to Refresh
                        refreshing={this.state.refreshing}
                        onRefresh={this.onRefresh.bind(this)}
                    />
                }>
                    {
                        this.state.packagesData
                            ?
                            this.state.packagesData.length === 0
                                ?
                                <Row size={12} style={[Styles.bgWhite, Styles.padV10]}>
                                    <Text style={[styles.title, Styles.padH10, Styles.f20, {color: '#000'}]}>No
                                        Deliveries Found...</Text>
                                </Row>
                                :
                                <FlatList
                                    style={{margin: 15}}
                                    data={this.state.packagesData}
                                    renderItem={({item}) => this.packagesList(item)}
                                    extraData={this.state}
                                    keyExtractor={(item, index) => index.toString()}/>
                            :
                            <CSpinner/>

                    }

                </ScrollView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    surface: {
        padding: 4,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRightWidth: 1,
        borderRightColor: "#f5f5f5"
    },
    'surface:last-child': {
        borderRightWidth: 0
    },
    row: {
        marginBottom: 10,
    },
    title: {
        fontFamily: 'Muli-Bold',
        paddingBottom: 12,
        color: "rgba(175,173,175,0.77)"
    },
    data: {
        fontFamily: 'Muli-Regular',
        fontSize: 16,
    },
    inline: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderRadius: 5,
        padding: 8
    },
    dHistoryGridOne: {
        fontFamily: 'Muli-Bold',
        paddingVertical: 25,
        paddingHorizontal: 20,
        color: '#000',
        textAlign: 'center',
        borderRightWidth: 1,
        borderRightColor: '#ccc'
    },
    dHistoryGridTwo: {
        fontFamily: 'Muli-Bold',
        paddingVertical: 25,
        paddingHorizontal: 20,
        color: '#000',
        width:160,
        textAlign: 'center',
    },
    dHistoryGridSub: {
        fontFamily: 'Muli-Bold',
        // backgroundColor: '#397af9',
        textAlign: 'center',
        color: '#000',
    }
});
