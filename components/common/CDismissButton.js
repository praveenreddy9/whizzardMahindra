import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions,TextInput} from 'react-native';
import {Styles} from "./Styles";
import {Card} from "react-native-paper";
import FastImage from "react-native-fast-image";
import {LoadImages} from "./LoadImages";
import {LoadSVG} from "./LoadSVG";
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';


const CDismissButton = ({children, cStyle, onPress, clickable, showButton, title,subtitle,siteCount,bgColor,textColor,TextValue,placeholder}) => {
    return (
        showButton === 'dismiss'
            ?
            <TouchableOpacity style={[Styles.marV5]} onPress={onPress}>
                <Card.Title
                    titleStyle={[Styles.f16, Styles.ffMregular, Styles.aslCenter]}
                    title='tap to dismiss'/>
            </TouchableOpacity>
            :
            showButton === 'dropDownClose'
                ?
                <TouchableOpacity onPress={onPress}
                                  style={{
                                      position: 'absolute',
                                      right: 5,
                                      top: 4,
                                      padding: 10
                                  }}>
                    {LoadSVG.chevornUp}
                </TouchableOpacity>
                :
                showButton === 'dropDownOpen'
                    ?
                    <TouchableOpacity onPress={onPress}>
                        <View pointerEvents='none'>
                            <TextInput style={[styles.input, {position: 'relative'}]}
                                       placeholder={placeholder} value={TextValue}/>
                            <View style={{
                                position: 'absolute',
                                right: 5,
                                top: 4,
                                padding: 10
                            }}>{LoadSVG.chevronDown}</View>
                        </View>
                    </TouchableOpacity>
                    :
            showButton === 'modalBgDismiss'
            ?
            <TouchableOpacity onPress={onPress}  style={[Styles.modalbgPosition]}>
            </TouchableOpacity>
            :
                showButton=== 'siteListingCard'
                ?
                    <TouchableOpacity onPress={onPress}
                        style={[Styles.marV10, Styles.row, Styles.aslCenter, Styles.jSpaceArd, Styles.br5,Styles.padV15,  {
                            backgroundColor:bgColor,
                            width: Dimensions.get('window').width - 20
                        }]}>

                        <View style={[ Styles.alignCenter, {width: Dimensions.get('window').width/6}]}>
                            <Text
                                style={[Styles.f22, Styles.ffMbold,{color:textColor} ]}>{siteCount}</Text>
                        </View>
                        <View style={[Styles.aslCenter,{width: Dimensions.get('window').width/1.7}]}>
                            <Text
                                style={[Styles.f18, Styles.ffMbold, Styles.cBlk, Styles.aslStart]}>{title}</Text>
                            {
                                subtitle ?
                                    <Text style={[Styles.f12, Styles.ffMbold, Styles.cBlk, Styles.aslStart ]}>({subtitle})</Text>
                                    :
                                    null
                            }
                        </View>

                        <MaterialIcons style={[Styles.aslCenter,  {width: Dimensions.get('window').width/9}]}
                              name="chevron-right" size={30} color="#000"/>
                    </TouchableOpacity>
                    :
                    showButton=== 'tripVerificationCard'
                        ?
                        <TouchableOpacity
                            onPress={onPress}
                            activeOpacity={0.7}
                                          style={[Styles.marV10, Styles.row, Styles.aslCenter, Styles.jSpaceArd, Styles.br5,Styles.padV15,
                                              Styles.bgDWhite,{
                                              // backgroundColor:bgColor,
                                              width: Dimensions.get('window').width - 20
                                          }]}>

                            <View style={[ Styles.aslStart, {width: Dimensions.get('window').width/1.7}]}>
                                <Text
                                    style={[Styles.f22, Styles.ffLRegular,Styles.cBlk ]}>{title}</Text>
                            </View>

                            <View style={[Styles.row]}>
                                <View style={[Styles.aslCenter,]}>
                                    <Text
                                        style={[Styles.f22, Styles.ffLRegular, Styles.cOrng, Styles.aslStart]}>{siteCount}</Text>
                                </View>

                                <MaterialIcons style={[Styles.aslCenter,  {width: Dimensions.get('window').width/9}]}
                                               name="chevron-right" size={27} color="#000"/>
                            </View>

                        </TouchableOpacity>
                    :
            <TouchableOpacity onPress={onPress}>
                <Card.Title
                    titleStyle={[Styles.f16, Styles.ffMregular]}
                    style={[Styles.marV5, Styles.bcLYellow, Styles.bw1, Styles.bgWhite]}
                    title={title}
                    left={() => <FastImage style={{width: 50, height: 60}}
                                           source={LoadImages.routePoint}/>}
                />
            </TouchableOpacity>

    );
};

const styles = StyleSheet.create({
    cText: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        padding: 15,
        fontFamily: 'OpenSans-Regular',
        fontSize: 16,
        borderRadius: 10,
        backgroundColor: '#fff',
        borderColor: '#ccc',
        color: '#000',
        borderWidth: 1
    },
})


export {CDismissButton};
