import React from 'react';
import { View, ActivityIndicator, Dimensions, Text, Image,ImageBackground } from 'react-native';
import FastImage from "react-native-fast-image";

var footerIcon = require("../../assets/images/footerIcon.png");


const FooterImage = ({ loop, data }) => {

    return (
            <FastImage style={[{height:50,width:Dimensions.get("window").width}]}
                       source={footerIcon}/>
    );
};

const styles = {
    loadingWrapper: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        position: 'absolute',
        // zIndex: 99999,
        // bottom:0
        // alignItems: 'flex-end'
        // justifyContent: 'end',
        // alignItems: 'center',
    }
};

export { FooterImage };
