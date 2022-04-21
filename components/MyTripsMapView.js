import React from 'react';
import {
    Text,
    View,
    Dimensions,
    StyleSheet,
    StatusBar,
    PermissionsAndroid,
    Animated,
    TouchableHighlight
} from 'react-native';
import MapView, {Marker, Polyline} from 'react-native-maps';
import Services from "./common/Services";
import Config from "./common/Config";
import {Appbar} from "react-native-paper";
import {CSpinner, Styles} from "./common";
import Utils from "./common/Utils";
import OfflineNotice from './common/OfflineNotice';
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import {Row} from "react-native-flexbox-grid";
import OneSignal from "react-native-onesignal";
import HomeScreen from "./HomeScreen";

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 12.2602;
const LONGITUDE = 77.1461;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;


class MyTripsMapView extends React.Component {
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
        this.mapRef = null;
        this.state = {
            region: {
                latitude: LATITUDE,
                longitude: LONGITUDE
            },
            coordinates: []
        }
    }

    async requestLocationPermission() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                // {
                //     title: Services.returnLocationTitle(),
                //     message:Services.returnLocationMessage(),
                //     // buttonNeutral: "Ask Me Later",
                //     // buttonNegative: "Cancel",
                //     buttonPositive: "OK"
                // },
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log('You can use the Location');
            } else {
                console.log('Location permission denied');
            }
        } catch (err) {
            console.warn(err);
        }
    }

    componentDidMount(): void {
        this.requestLocationPermission();
        this.setState({shiftId: this.props.navigation.state.params.shiftId});
        this.getGeoLocations();
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    getGeoLocations() {
        const self = this;
        const shiftId = this.props.navigation.state.params.shiftId;
        const getTrips = Config.routes.BASE_URL + Config.routes.GET_LOCATIONS + shiftId;
        const body = '';
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(getTrips, "GET", body, function (response) {
                if (response) {
                    const tripsList = response.data;
                    // console.log("tripsdata locations", tripsList);
                    const coordinates = [];
                    const PolyLine = [];
                    // console.log('trip data length',tripsData.length,tripsData)
                    if (tripsList.locations) {
                        const tripsData = tripsList.locations;
                        if (tripsData.length > 0) {
                            for (let i = 0; i < tripsData.length; i++) {
                                var data = {};
                                data.LatLng = {};
                                let latitude = tripsData[i].latitude;
                                let longitude = tripsData[i].longitude;
                                data.LatLng.latitude = latitude;
                                data.LatLng.longitude = longitude;
                                data.latitude = latitude;
                                data.longitude = longitude;
                                data.id = i;
                                data.title = JSON.stringify(i);
                                if (tripsData[i].createdAt != null) {
                                    data.locationDate = new Date(tripsData[i].createdAt).toDateString();
                                    data.time = new Date(tripsData[i].createdAt).getHours() + ":" + new Date(tripsData[i].createdAt).getMinutes();
                                }
                                coordinates.push(data);
                                var patternData = {};
                                patternData.latitude = tripsData[i].latitude;
                                patternData.longitude = tripsData[i].longitude;
                                PolyLine.push(patternData)
                            }
                            // console.log('coordinates', coordinates);

                            self.setState({
                                showMaps: true,
                                coordinates: coordinates,
                                PolyLine: PolyLine,
                                spinnerBool: false,
                                LATITUDE: coordinates[0].LatLng.latitude,
                                LONGITUDE: coordinates[0].LatLng.longitude,
                                LAST_INDEX: tripsData.length - 1
                            })
                        }else {
                            Utils.dialogBox('No location data found', '');
                            self.setState({
                                showMaps: false,
                                coordinates: coordinates,
                                spinnerBool: false
                            })
                        }
                    } else {
                        Utils.dialogBox('No location data found', '');
                        self.setState({
                            showMaps: false,
                            coordinates: coordinates,
                            spinnerBool: false
                        })
                    }
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
                        Utils.dialogBox("Error loading Shift Data, Please contact Administrator ", '');
                    }
                } else {
                    self.setState({spinnerBool: false});
                    Utils.dialogBox(error.message, '');
                }
            });
        })
    }

    onMapLayout = () => {
        this.mapRef.fitToCoordinates(this.state.coordinates, {
            edgePadding: {top: 50, right: 10, bottom: 10, left: 10},
            animated: true
        })
    }

    render() {
        return (
            <View style={[Styles.flex1]}>
                <OfflineNotice/>
                {this.renderSpinner()}
                {
                    this.state.coordinates.length > 0 ?
                        <View style={[Styles.flex1]}>
                            <Appbar.Header style={[Styles.bgWhite]}>
                                <Appbar.BackAction onPress={() => {
                                    this.props.navigation.goBack()
                                }}/>
                                <Appbar.Content title="Trip View" subtitle=""/>
                            </Appbar.Header>

                            <View style={styles.container}>
                                {
                                    this.state.coordinates.length === 0
                                        ?
                                        null
                                        :
                                        <MapView
                                            ref={(ref) => {
                                                this.mapRef = ref
                                            }}
                                            initialRegion={{
                                                latitude: this.state.LATITUDE,
                                                longitude: this.state.LONGITUDE,
                                                latitudeDelta: LATITUDE_DELTA,
                                                longitudeDelta: LONGITUDE_DELTA,
                                            }}
                                            style={StyleSheet.absoluteFill}// eslint-disable-line react/jsx-no-bind
                                            loadingEnabled={true}
                                            showsUserLocation
                                            zoomEnabled={true}
                                            scrollEnabled={true}
                                            showsScale={true}
                                            onMapReady={this.onMapLayout}
                                        >
                                            {
                                                this.state.coordinates.map(coordinate => (
                                                    <Marker
                                                        coordinate={{
                                                            latitude: coordinate.LatLng.latitude,
                                                            longitude: coordinate.LatLng.longitude
                                                        }}
                                                        zoomEnabled={true}
                                                        mapType={'standard'}
                                                        key={coordinate.id}
                                                        pinColor={coordinate.id === 0 ? 'green' : coordinate.id === (this.state.coordinates.length - 1) ? 'red' : 'yellow'}
                                                    >
                                                        <MapView.Callout>
                                                            <View style={{
                                                                borderRadius: 10,
                                                                padding: 7
                                                            }}>
                                                                <TouchableHighlight underlayColor='#dddddd'>
                                                                    <Row size={12}>
                                                                        <Text
                                                                            style={{textAlign: 'center'}}>
                                                                            {coordinate.locationDate || '---'}{"\n"}
                                                                            {coordinate.time || '---'}
                                                                        </Text>
                                                                    </Row>
                                                                </TouchableHighlight>
                                                            </View>
                                                        </MapView.Callout>
                                                    </Marker>
                                                ))
                                            }

                                            <Polyline
                                                coordinates={this.state.PolyLine}
                                                strokeColor="#db2b30" // fallback for when `strokeColors` is not supported by the map-provider
                                                strokeColors={[
                                                    '#7F0000',
                                                    '#00000000', // no color, creates a "long" gradient between the previous and next coordinate
                                                    '#B24112',
                                                    '#E5845C',
                                                    '#238C23',
                                                    '#7F0000'
                                                ]}
                                                strokeWidth={4}
                                            />

                                        </MapView>
                                }
                            </View>
                        </View>
                        :
                        <View style={[Styles.flex1, Styles.bgWhite, {justifyContent: 'center', alignSelf: 'center'}]}>
                            <MaterialIcons
                                style={[Styles.aslCenter, Styles.m10, {fontFamily: "Muli-Bold"}]}
                                name="location-off" size={130} color="#000"/>
                            <Text style={[{fontFamily: 'Muli-Bold', padding: 10, fontSize: 20, color: '#000'}]}>No
                                Locations Found</Text>
                        </View>
                }
            </View>
        );
    }
}

/*
MyTripsMapView.propTypes = {
    provider: ProviderPropType,
};
*/

const styles = StyleSheet.create({
    container: {
        // ...StyleSheet.absoluteFillObject,
        position: 'absolute',
        left: 0,
        right: 0,
        top: 60,
        bottom: 0,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },

    bubble: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        marginVertical: 20,
        backgroundColor: 'transparent',
    },
});

export default MyTripsMapView;
