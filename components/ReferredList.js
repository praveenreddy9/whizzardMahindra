import React, {Component} from "react";
import {View, Text, StyleSheet, FlatList, ActivityIndicator, Dimensions, BackHandler, Linking} from "react-native";
import {Appbar, DefaultTheme, Card, Button} from "react-native-paper";
import Config from "./common/Config";
import Services from "./common/Services";
import Utils from "./common/Utils";
import {CSpinner, LoadSVG, Styles} from "./common";
import OfflineNotice from './common/OfflineNotice';
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";


const theme = {
    ...DefaultTheme,
    fonts: {
        medium: 'Muli-Bold'
    }
};

export class ReferredList extends Component {

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
        this.state = {
            data: [],
            page: 1,
            spinnerBool: false,
            size: 10,
            isLoading: false,
            isRefreshing: false,
        };
    }

    componentDidMount() {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
                Services.checkMockLocationPermission((response) => {
                    if (response){
                        this.props.navigation.navigate('Login')
                    }
                })
            self.getReferredList();
        });
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    getReferredList() {
        const {data, page} = this.state;
        this.setState({isLoading: true});
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_REFERRED_LIST;
        const body = {
            page: self.state.page,
            sort: "name,desc",
            size: 10
        };
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                     // console.log("res data.content", response);
                    self.setState({
                        data: page === 1 ? response.data : [...data, ...response.data],
                        totalPages: response.data.totalPages,
                        isRefreshing: false,
                        spinnerBool: false
                    })
                }
            }, function (error) {
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
                        Utils.dialogBox("Error loading My Referrals, Please contact Administrator ", '');
                    }
                } else {
                    self.setState({spinnerBool: false});
                    Utils.dialogBox(error.message, '');
                }
            })
        })
    };

    handleLoadMore = () => {
        this.state.page < this.state.totalPages ?
            this.setState({
                page: this.state.page + 1
            }, () => {
                this.getReferredList();
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
            this.getReferredList();
        });
    };

    render() {
        const {data, isRefreshing} = this.state;
        return (
            <View style={styles.container}>
                <OfflineNotice/>
                <View style={[Styles.appbarBorder]}>
                    <Appbar.Header theme={theme} style={[Styles.bgWhite,]}>
                        <Appbar.Action icon="chevron-left" size={30} onPress={() => {
                            this.props.navigation.goBack()
                        }}/>
                        <Appbar.Content title="Referred List"/>
                    </Appbar.Header>
                </View>
                {this.renderSpinner()}
                <View>
                    {
                        data.length > 0 ?
                            <FlatList
                                data={data}
                                renderItem={({item, index}) => (
                                    <Card style={[Styles.appbarBorder,{
                                        padding: 7,
                                        borderRadius: 0,
                                    }]}>
                                        <Card.Title
                                            theme={theme}
                                            style={[Styles.marH10]}
                                            title={item.fullName}
                                            titleStyle={[Styles.ffMbold, Styles.f16]}
                                            subtitleStyle={[Styles.ffMregular, {color:'#1b1b1b'}]}
                                            subtitle={Services.returnRoleName(item.attrs.role)}
                                            left={() => Services.getUserProfilePic(item.attrs.profilePicUrl)}
                                            right={() => <View
                                                style={[Styles.alignCenter, Styles.br30, {
                                                    padding: 3,
                                                    backgroundColor: item.status === 'ACTIVATION_PENDING' ? '#ffefa1' : '#c5f7c6',
                                                    borderWidth:2,
                                                    borderColor: item.status === 'ACTIVATION_PENDING' ? '#d7cc96' : '#86cd8f',
                                                    width: Dimensions.get('window').width / 3
                                                }]}>
                                                <Text
                                                    style={[Styles.ffMbold]}>{item.status === 'ACTIVATION_PENDING' ? 'Pending' : 'Activated'}</Text>
                                            </View>}
                                        />
                                    </Card>

                                )}
                                keyExtractor={(item, index) => index.toString()}
                                refreshing={isRefreshing}
                                onRefresh={this.handleRefresh}
                                onEndReached={this.handleLoadMore}
                                onEndReachedThreshold={1}
                                contentContainerStyle={{paddingBottom: 50}}
                                ListFooterComponent={this.renderFooter}
                            />
                            :
                            <View style={[Styles.aslCenter, Styles.alignCenter, Styles.marV40,Styles.marH15]}>
                                {LoadSVG.dataNotFound}
                                <Text style={[Styles.cBlk, Styles.f20, Styles.aslCenter, Styles.ffMregular, Styles.marV20]}>
                                    You haven't referred anyone yet, share your referral link and get exciting rewards*
                                </Text>

                                <Button
                                    style={[Styles.aslCenter, Styles.bgBlue, Styles.padH25, Styles.marV10]}
                                    mode="contained" onPress={()=>this.props.navigation.navigate('ReferAFriend') }>
                                    REFER A FRIEND
                                </Button>
                            </View>
                    }
                </View>
            </View>
        );
    }
}

export default ReferredList;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff"
    },
});
