import React from 'react';
import {
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    FlatList, ActivityIndicator, Linking, Modal, BackHandler, Alert
} from 'react-native';
import {Styles, CSpinner, CText} from './common'
import Utils from "./common/Utils";
import Config from "./common/Config";
import Services from "./common/Services";
import {
    Appbar,
    Card,
    DefaultTheme,
    Searchbar,
    Title
} from "react-native-paper";
import _ from 'lodash';
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/dist/MaterialCommunityIcons";
import OfflineNotice from './common/OfflineNotice';
import AsyncStorage from "@react-native-community/async-storage";
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";


const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};
export default class Pipeline extends React.Component {

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
        this.didFocus = props.navigation.addListener('didFocus', payload =>
            BackHandler.addEventListener('hardwareBackPress', this.onBack),
        );
        this.state = {
            data: [],usersList:[],
            page: 1,
            size: 10,
            isLoading: false,
            isRefreshing: false,
            refreshing: false, spinnerBool: false, SearchBarView: false,
            UsersList: [], filter: true, selectedUserSiteDetails: '', navigatorModalList: false, index: '0',NavigationListModal:false,selectedProfile:[],
            totalUsersData:[],searchData:''
        };
    }

    onBack = () => {
        return this.props.navigation.navigate('TeamListingScreen');
    };

    componentDidMount() {
        this.willBlur = this.props.navigation.addListener('willBlur', payload =>
            BackHandler.removeEventListener('hardwareBackPress', this.onBack)
        );
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            AsyncStorage.getItem('Whizzard:selectedUserSiteDetails').then((selectedUserSiteDetails) => {
            AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
            this.setState({
                userRole:userRole,
                  selectedUserSiteDetails: JSON.parse(selectedUserSiteDetails),
            }, (data) => {
                self.AllUsersLIST('',1);
            })
        });
        });
        });
    }

    componentWillUnmount() {
        this.didFocus.remove();
        this.willBlur.remove();
        BackHandler.removeEventListener('hardwareBackPress', this.onBack);
        Services.checkMockLocationPermission((response) => {
            if (response){
                this.props.navigation.navigate('Login')
            }
        })
    }


    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    errorHandling(error) {
        // console.log("pipeline error", error, error.response);
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


    //API CALL FOR ALL USERS LIST(used in first fetch,search,reload)
    AllUsersLIST(name,pageNo) {
        const {usersList, page} = this.state;
        this.setState({isLoading: true});
        const self = this;
        const siteId = self.state.selectedUserSiteDetails.siteId;
        const apiURL = Config.routes.BASE_URL + Config.routes.USERS_SUPERVISOR;
        const body = JSON.stringify({
            siteId: siteId,
            byUserNameAndRole: name,
            // page: self.state.page,
            page: pageNo,
            sort: "fullName, desc",
            size: 20
        });
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiURL, "POST", body, function (response) {
                if (response.status === 200) {
                    // console.log("pipeline users list 200", response.data);
                    self.setState({
                        usersList: pageNo === 1 ? response.data.content : [...usersList, ...response.data.content],
                        totalPages: response.data.totalPages,
                        isRefreshing: false,
                        spinnerBool: false,
                        page:pageNo
                        // totalUsersData:response.data.content,
                        // SearchBarView:false,
                        // searchData:''
                    })
                }
            }, function (error) {
                self.errorHandling(error)
            });
        })
    }

    handleLoadMore = () => {
        this.state.page < this.state.totalPages ?
            this.setState({
                page: this.state.page + 1
            }, () => {
                this.AllUsersLIST(this.state.searchData,this.state.page);
            })
            :
            null
    };

    renderFooter = () => {
        return (
            this.state.page < this.state.totalPages ?
                <View>
                    <ActivityIndicator animating size="large"/>
                </View> :
                null
        );
    };
    handleRefresh = () => {
        this.setState({
            isRefreshing: true,
        }, () => {
            this.AllUsersLIST(this.state.searchData,1);
        });
    };

    filterData(order) {
        if (order === 'Ascending') {
            this.setState({
                usersList: this.state.usersList.sort(function (a, b) {
                    let nameA = a.fullName.toUpperCase(); // ignore upper and lowercase
                    let nameB = b.fullName.toUpperCase(); // ignore upper and lowercase
                    if (nameA < nameB) {
                        return -1;
                    }
                    if (nameA > nameB) {
                        return 1;
                    }
                    return 0;
                }),
                filter: false
            })
        } else {
            this.setState({
                usersList: this.state.usersList.sort(function (a, b) {
                    let nameA = a.fullName.toUpperCase(); // ignore upper and lowercase
                    let nameB = b.fullName.toUpperCase(); // ignore upper and lowercase
                    if (nameA < nameB) {
                        return 1;
                    }
                    if (nameA > nameB) {
                        return -1;
                    }
                    return 0;
                }),
                filter: true
            })
        }
    }

    selectedCard(selectedItem){
        let tempQArray = this.state.usersList;
         for (let i = 0; i < tempQArray.length; i++) {
            if (tempQArray[i].id === selectedItem.id) {
                this.setState({displayPickerList:true})
             }
            else {
                this.setState({displayPickerList:false})
            }
        }
    }

    onRefresh() {
        //Clear old data of the list
        this.setState({dataSource: [], SearchBarView: false});
        //Call the Service to get the latest data
        this.AllUsersLIST(this.state.searchData,1);
    }

    render() {
        const {usersList, isRefreshing,selectedProfile} = this.state;
        if (this.state.refreshing) {
            return (
                <View style={{flex: 1, paddingTop: 20}}>
                    <ActivityIndicator/>
                </View>
            );
        }
        return (
            <View style={[[Styles.flex1, Styles.bgWhite]]}>
                <OfflineNotice/>
                {
                    usersList ?
                        <View style={[[Styles.flex1, Styles.bgWhite]]}>
                            <View style={[Styles.bgWhite]}>
                                <Appbar.Header theme={theme} style={Styles.bgDarkRed}>
                                    <Appbar.BackAction onPress={() => this.onBack()}/>
                                    <Appbar.Content title="Site Team" titleStyle={[Styles.ffLBold]}/>
                                    <Appbar.Action icon="sort-by-alpha" size={28}
                                                   onPress={() => {
                                        this.state.filter === true ? this.filterData('Ascending') : this.filterData('Descending')
                                    }}/>
                                    {
                                        this.state.SearchBarView
                                        ?
                                            <Appbar.Action onPress={() => {  this.setState({SearchBarView: !this.state.SearchBarView,searchData:''},()=>{
                                                this.AllUsersLIST('',1);
                                            })
                                            }} icon={ "cancel"} style={[Styles.bgWhite,Styles.br30,Styles.p5]}
                                                           color={  'red'}/>
                                                           :
                                            <Appbar.Action onPress={() => {
                                                this.setState({SearchBarView: !this.state.SearchBarView})
                                            }} icon={ "search"}
                                                           color={  "#fff" }/>

                                    }

                                </Appbar.Header>
                            </View>
                            {this.renderSpinner()}
                            {/*MODAL FOR NavigationList*/}
                            <Modal
                                transparent={true}
                                visible={this.state.NavigationListModal}
                                onRequestClose={() => {
                                    this.setState({NavigationListModal: false})
                                }}>
                                <View style={[Styles.modalfrontPosition]}>
                                    <TouchableOpacity onPress={() => {
                                        this.setState({NavigationListModal: false})
                                    }} style={[Styles.modalbgPosition]}>
                                    </TouchableOpacity>
                                    <View  style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br30, Styles.mBtm20, {width: Dimensions.get('window').width - 60}]}>
                                        {
                                            selectedProfile
                                                ?
                                                <View style={[Styles.aslCenter, Styles.p5, Styles.padV5]}>
                                                    {
                                                         selectedProfile.attrs
                                                        ?
                                                            <View style={[Styles.aslCenter, Styles.padH30]}>
                                                                {Services.getUserProfilePic( selectedProfile.attrs.profilePicUrl)}
                                                            </View>
                                                            :
                                                            null
                                                    }

                                                    <Title  style={[Styles.cBlk, Styles.f18, Styles.ffMbold, Styles.aslCenter,Styles.pTop5]}>{_.startCase(_.toLower( selectedProfile.fullName))}</Title>
                                                    <Title  style={[Styles.cBlk, Styles.f14, Styles.ffMbold, Styles.aslCenter]}>{Services.getUserRoles(selectedProfile.role)}</Title>
                                                </View>
                                                :
                                                null
                                        }
                                        <TouchableOpacity
                                            onPress={() => this.setState({NavigationListModal: false},()=> {
                                                Linking.openURL(`tel:${selectedProfile.phoneNumber}`);  })}
                                            style={[Styles.p15, Styles.br5,  {backgroundColor: '#f9d8d9'},  Styles.m10, Styles.marH30]}>
                                            <View  style={[Styles.row,Styles.jSpaceBet]}>
                                                <CText  cStyle={[Styles.ffMbold, Styles.aslCenter, Styles.f20, {marginLeft: 20,color:'#408821'}  ]}>Call</CText>
                                                <MaterialIcons name="navigate-next" size={30} color={'#408821'} />
                                            </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={()=>{this.setState({NavigationListModal:false},()=>{
                                                this.props.navigation.navigate('CreateShift', {
                                                    toUserDetails:{
                                                        userId: selectedProfile.id,
                                                        userName: selectedProfile.fullName,
                                                        phoneNumber: selectedProfile.userName,
                                                        role: selectedProfile.role,
                                                        userProfilePic: selectedProfile.attrs.profilePicUrl,
                                                        dayStatus: this.state.selectedUserSiteDetails.dayStatus,
                                                        siteId: this.state.selectedUserSiteDetails.siteId,
                                                        siteName: this.state.selectedUserSiteDetails.siteName,
                                                        screenName:'Pipeline'
                                                    },
                                                 })
                                            })}}
                                            style={[Styles.p15, Styles.br5,  {backgroundColor: '#f9d8d9'},  Styles.m10, Styles.marH30]}>
                                            <View  style={[Styles.row,Styles.jSpaceBet]}>
                                                <CText  cStyle={[Styles.ffMbold, Styles.aslCenter, Styles.f20, {marginLeft: 20,color:'#408821'}  ]}>Assign Shift</CText>
                                                <MaterialIcons name="navigate-next" size={30}color={'#408821'} />
                                            </View>
                                        </TouchableOpacity>

                                        {/*<TouchableOpacity*/}
                                        {/*    onPress={()=> this.setState({NavigationListModal:false},()=>{*/}
                                        {/*        this.props.navigation.navigate('AddVoucher', {*/}
                                        {/*            userDetails: selectedProfile,*/}
                                        {/*            userId:selectedProfile.id  })*/}
                                        {/*    })  }*/}
                                        {/*    style={[Styles.p15, Styles.br5,  {backgroundColor: '#f9d8d9'},  Styles.m10, Styles.marH30]}>*/}
                                        {/*    <View  style={[Styles.row,Styles.jSpaceBet]}>*/}
                                        {/*        <CText  cStyle={[Styles.ffMbold, Styles.aslCenter, Styles.f20, {marginLeft: 20,color:'#408821'}  ]}>Add Voucher</CText>*/}
                                        {/*        <MaterialIcons name="navigate-next" size={30} color={'#408821'} />*/}
                                        {/*    </View>*/}
                                        {/*</TouchableOpacity>*/}

                                                <TouchableOpacity
                                                    onPress={()=> this.setState({NavigationListModal:false},()=>{
                                                        // this.props.navigation.navigate('profile', {
                                                        this.props.navigation.navigate('NewProfileScreen', {
                                                            UserFlow: 'SITE_ADMIN',
                                                            UserStatus:"ACTIVATED",
                                                            selectedProfileUserID:selectedProfile.id
                                                        })
                                                    })  }
                                                    style={[Styles.p15, Styles.br5,  {backgroundColor: '#f9d8d9'},  Styles.m10, Styles.marH30]}>
                                                    <View  style={[Styles.row,Styles.jSpaceBet]}>
                                                        <CText  cStyle={[Styles.ffMbold, Styles.aslCenter, Styles.f20, {marginLeft: 20,color:'#408821'}  ]}>{this.state.userRole === '45' ? 'Update Profile' : 'View Profile'}</CText>
                                                        <MaterialIcons name="navigate-next"  size={30} color={'#408821'} />
                                                    </View>
                                                </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={()=> this.setState({NavigationListModal:false},()=>{
                                                this.props.navigation.navigate('CalendarShifts',{userId:selectedProfile.id})
                                            })  }
                                            style={[Styles.p15, Styles.br5,  {backgroundColor: '#f9d8d9'},  Styles.m10, Styles.marH30]}>
                                            <View  style={[Styles.row,Styles.jSpaceBet]}>
                                                <CText  cStyle={[Styles.ffMbold, Styles.aslCenter, Styles.f20, {marginLeft: 20,color:'#408821'}  ]}>Calendar Shifts</CText>
                                                <MaterialIcons name="navigate-next"  size={30} color={'#408821'} />
                                            </View>
                                        </TouchableOpacity>



                                        <TouchableOpacity style={[Styles.marV30]} onPress={() => {
                                            this.setState({NavigationListModal: false})
                                        }}>
                                            <View
                                                style={[Styles.p15, Styles.br5, Styles.marH30, {backgroundColor: '#f5f5f5'}]}>
                                                <Text style={[Styles.ffMregular, Styles.f16, {textAlign:'center'}]}>tap to dismiss</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>

                                </View>

                            </Modal>


                            {
                                this.state.SearchBarView === true
                                    ?
                                    <Searchbar
                                        style={{margin: 10}}
                                        isFocused="false"
                                        placeholder="Search by name"
                                        onChangeText={searchData => {
                                            this.setState({searchData: searchData},()=>{

                                               this.AllUsersLIST(searchData,1)
                                            })
                                        }}
                                        onSubmitEditing={()=>{this.AllUsersLIST(this.state.searchData,1)}}
                                        value={this.state.searchData}
                                    />
                                    :
                                    null
                            }
                            <View style={[Styles.flex1]}>
                                {
                                    usersList.length > 0 ?
                                        <View style={[Styles.mBtm10,Styles.flex1]}>
                                            <FlatList
                                                data={usersList}
                                                style={[{flex:1}]}
                                                renderItem={({item, index}) =>
                                                    <TouchableOpacity onPress={() => {
                                                        this.setState({NavigationListModal: true,selectedProfile:item,SearchBarView:false});
                                                    }} style={{paddingHorizontal: 10, paddingVertical: 5}}>
                                                        <Card style={[Styles.bgWhite, Styles.OrdersScreenCardshadow, {
                                                            // position: 'relative',
                                                            // marginBottom: 5,
                                                            borderRadius: 0,
                                                            padding: 4,
                                                            borderWidth: 1,
                                                            // borderBottomWidth: 1,
                                                            // borderTopWidth: 1,
                                                            // borderRightWidth: 1,
                                                            borderLeftWidth: 3,
                                                            borderLeftColor: '#000',
                                                            borderRightColor: 'rgba(87,87,87,0.17)',
                                                            borderTopColor: 'rgba(87,87,87,0.17)',
                                                            borderBottomColor: 'rgba(87,87,87,0.17)',
                                                            paddingRight: 20
                                                        }]}>
                                                            <Card.Title
                                                                left={() => Services.getUserProfilePic(item.attrs.profilePicUrl)}
                                                                title={_.startCase(_.toLower(item.fullName))}
                                                                titleStyle={[{fontFamily: 'Muli-Bold', fontSize: 18}]}
                                                                subtitleStyle={[{fontFamily: "Muli-Regular"}]}
                                                                subtitle={Services.getUserRoles(item.role)}
                                                                right={() => <MaterialCommunityIcons name="dots-vertical" size={30} color="black" />}
                                                            >
                                                            </Card.Title>
                                                        </Card>
                                                    </TouchableOpacity >}
                                                keyExtractor={(item, index) => index.toString()}
                                                refreshing={isRefreshing}
                                                onRefresh={this.handleRefresh}
                                                onEndReached={this.handleLoadMore}
                                                onEndReachedThreshold={1}
                                                contentContainerStyle={{paddingBottom: 50}}
                                                ListFooterComponent={this.renderFooter}/>
                                        </View>
                                        :
                                        <View style={[ Styles.alignCenter, Styles.mTop40]}>
                                            <Text style={[Styles.aslCenter,Styles.f18,Styles.ffMbold,Styles.colorBlue]}>No Users data found..</Text>
                                        </View>
                                }
                            </View>
                        </View>
                        :
                        <CSpinner/>
                }
            </View>
        );
    }
}


