import React from 'react';
import {
    Text, View, ScrollView,
    FlatList, ActivityIndicator, RefreshControl, BackHandler, Alert
} from 'react-native';
import {Styles, CSpinner} from './common'
import Utils from "./common/Utils";
import Config from "./common/Config";
import Services from "./common/Services";
import {
    Appbar,
    DefaultTheme, Searchbar,
} from "react-native-paper";
import _ from 'lodash';
import OfflineNotice from './common/OfflineNotice';
import {CDismissButton} from "./common";
import HomeScreen from "./HomeScreen";
import OneSignal from "react-native-onesignal";


const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Regular'
    }
};


export default class SiteListingScreen extends React.Component {

    constructor(props) {
        super(props);
        this.didFocus = props.navigation.addListener('didFocus', payload =>
            BackHandler.addEventListener('hardwareBackPress', this.onBack),
        );
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
        this.state = {
            refreshing: false, spinnerBool: false,
            loggedInUserDetails: [],
            filter: true,
            SearchBarView: false,searchData:''
        };
    }

    onBack = () => {
        return this.props.navigation.navigate('HomeScreen');
    };

    componentDidMount() {
        this.willBlur = this.props.navigation.addListener('willBlur', payload =>
            BackHandler.removeEventListener('hardwareBackPress', this.onBack)
        );
        const self = this;
        // this._subscribe = this.props.navigation.addListener('didFocus', () => {
            self.getSiteInfo('');
        // });
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        })
    }

    componentWillUnmount() {
        this.didFocus.remove();
        this.willBlur.remove();
        BackHandler.removeEventListener('hardwareBackPress', this.onBack);
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    onRefresh() {
        //Clear old data of the list
        this.setState({dataSource: []});
        //Call the Service to get the latest data
        this.getSiteInfo(this.state.searchData);
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

    getSiteInfo(searchData) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_SUPERVISOR_INFO + '?siteName=' + searchData;
        // console.log('sites apiUrl',apiUrl);
        const body = '';
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, "GET", body, function (response) {
                // console.log('sites resp200', response.data);
                if (response.status === 200) {
                    let siteInfo = response.data;
                    self.setState({
                        refreshing: false,
                        siteInfo: siteInfo,
                        supervisorSites: siteInfo.supervisorSites,
                        spinnerBool: false,
                    });
                }
            }, function (error) {
                self.errorHandling(error)
            })
        })
    }

    filter(order) {
        if (order === 'Ascending') {
            this.setState({
                supervisorSites: this.state.supervisorSites.sort(function (a, b) {
                    let nameA = a.name.toUpperCase(); // ignore upper and lowercase
                    let nameB = b.name.toUpperCase(); // ignore upper and lowercase
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
                supervisorSites: this.state.supervisorSites.sort(function (a, b) {
                    let nameA = a.name.toUpperCase(); // ignore upper and lowercase
                    let nameB = b.name.toUpperCase(); // ignore upper and lowercase
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
            <View style={[[Styles.flex1, Styles.bgWhite]]}>
                <OfflineNotice/>
                <View style={[Styles.bgWhite, {elevation: 1}]}>
                    <Appbar.Header theme={theme} style={Styles.bgWhite}>
                        <Appbar.BackAction onPress={() => this.onBack()}/>
                        <Appbar.Content
                            title={"My Sites" + ' (' + (this.state.supervisorSites ? this.state.supervisorSites.length : '0') + ')'}
                            subtitle=''/>
                        {/*<Appbar.Action icon="map" onPress={()=>this.props.navigation.navigate('UsersMapView')}/>*/}
                        {this.state.filter === true ?
                            <Appbar.Action icon="sort-by-alpha" onPress={() => this.filter('Ascending')}/> :
                            <Appbar.Action icon="sort-by-alpha" onPress={() => this.filter('Descending')}/>}
                        {
                            this.state.SearchBarView === false ?
                                <Appbar.Action onPress={() => {
                                    this.setState({SearchBarView: true})
                                }} icon="search"/> :
                                <Appbar.Action onPress={() => {
                                    this.setState({SearchBarView: false})
                                }} icon="cancel" color={'red'}/>
                        }
                    </Appbar.Header>
                </View>
                {this.renderSpinner()}
                {
                    this.state.SearchBarView === true
                        ?
                        <Searchbar
                            isFocused="false"
                            placeholder="Search by site name or site code"
                            onChangeText={searchData => {
                                this.setState({searchData: searchData}, () => {
                                    this.getSiteInfo(searchData)
                                })
                            }}
                            onSubmitEditing={()=>{this.getSiteInfo(this.state.searchData)}}
                            value={this.state.searchData}
                        />
                        :
                        null
                }

                {
                    this.state.siteInfo
                        ?
                        <ScrollView
                            refreshControl={
                                <RefreshControl
                                    //refresh control used for the Pull to Refresh
                                    refreshing={this.state.refreshing}
                                    onRefresh={this.onRefresh.bind(this)}
                                />
                            }>
                            <View style={[Styles.marH15, Styles.marV10]}>
                                <Text style={[Styles.f16, Styles.ffMbold, {color: '#999999'}]}>Select a site to view
                                    today's
                                    shifts. To add a new shift, select a site to which you want to add the shift
                                    and press +</Text>
                            </View>


                            <CDismissButton
                                onPress={() => {this.setState({SearchBarView: false})
                                    const  selectedUserSiteDetails= {
                                        siteId: '',
                                        siteName: 'All Sites',
                                        siteCode:'All Sites'
                                    }
                                    Utils.setToken('selectedSiteDetails',JSON.stringify(selectedUserSiteDetails), function () {
                                    })
                                    this.props.navigation.navigate('TeamListingScreen')
                                }}

                                            title={'All sites'}
                                            siteCount={this.state.siteInfo.totalShiftsCount ? this.state.siteInfo.totalShiftsCount : 0}
                                            bgColor={'#ccf6d8'}
                                            textColor={'#519a4d'}
                                            showButton={'siteListingCard'}
                            />
                            <FlatList
                                style={[Styles.aslCenter]}
                                data={this.state.supervisorSites}
                                renderItem={({item, index}) => {
                                    let colors = ['#D6D1B4', '#F3F2F2', '#FFEE93', '#ccf6d8', '#F8F1EC', '#ECF3AB', '#F4EDAB'];
                                    let fontColors = ['#8B814C', '#8B8682', '#EEC900', '#519a4d', '#BC7642', '#D1E231', '#D6C537'];
                                    return (
                                        <ScrollView>
                                            <CDismissButton
                                                onPress={() => {this.setState({SearchBarView: false})
                                                    const  selectedUserSiteDetails= {
                                                        siteId: item.siteId,
                                                        siteName: item.name,
                                                        siteCode:item.siteCode
                                                    }
                                                    Utils.setToken('selectedSiteDetails',JSON.stringify(selectedUserSiteDetails), function () {
                                                    })
                                                    this.props.navigation.navigate('TeamListingScreen')
                                                }}

                                                            title={_.startCase(item.name)}
                                                            subtitle={_.startCase(item.siteCode)}
                                                            siteCount={item.shiftsCount ? item.shiftsCount : 0}
                                                            bgColor={colors[index % colors.length]}
                                                            textColor={fontColors[index % fontColors.length]}
                                                            showButton={'siteListingCard'}
                                            />
                                        </ScrollView>
                                    )
                                }}
                                extraData={this.state}
                                keyExtractor={(item, index) => index.toString()}/>
                        </ScrollView>
                        :
                        <CSpinner/>
                }
                {/*<FooterImage/>*/}
            </View>
        )
    }

}
