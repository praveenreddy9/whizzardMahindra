import React from 'react';
import { View, ActivityIndicator, Dimensions, Text, Image } from 'react-native';


const CLoader = ({ loop, data }) => {

    return (
        <View style={[styles.loadingWrapper]}>
            <Image style={{ width: 80, height: 80}} source={require("../../assets/io_rolling2.px.gif")} />
            {/*<FontAwesome name="spinner" size={50} color="#f3cc14" />*/}
            {/* <Text style={{ color: '#FF0000', marginTop: 20, fontSize: 20 }} >Loading...</Text> */}
        </View>
    );
};

const styles = {
    loadingWrapper: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        position: 'absolute',
        zIndex: 99999,
        backgroundColor: 'rgba(220,220,220,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    }
};

export { CLoader };
