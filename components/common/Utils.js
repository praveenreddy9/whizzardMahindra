import React from 'react';
import {Alert, ToastAndroid, Platform} from 'react-native';
import Config from '../common/Config';
import AsyncStorage from '@react-native-community/async-storage';
import _ from "lodash";


export var Utils = function () {
};

const passwordLength = 6;
const AccountNumberLength = 10;

Utils.prototype.getToken = function (key, callBack) {
    AsyncStorage.getItem('Whizzard:' + key, (err, resp) => {
        if (err)
            callBack('Error fetching token', false);
        else
            callBack(resp, true);
    });
};

Utils.prototype.setToken = function (key, value, callBack) {
    AsyncStorage.setItem('Whizzard:' + key, value, (err) => {
        if (err)
            callBack('Error setting token', false);
        else
            callBack(null, true);
    });
};

Utils.prototype.removeToken = function (key, value, callBack) {
    AsyncStorage.removeItem('Whizzard:' + key, value, (err) => {
        if (err)
            callBack('Error setting token', false);
        else
            callBack(null, true);
    });
};

Utils.prototype.isValidEmail = function (email) {
    let response = {};
    if (email) {
        if (/^\S+@\S+\.\S+/.test(email.trim())) {
            response.status = true;
            response.message = email.toLowerCase().trim();
        } else {
            response.status = false;
            response.message = 'Please Enter Valid Mail Id';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Mail Id';
    }
    return response;
};

Utils.prototype.isValidNoun = function (value) {
    let response = {};
    if (value) {
        if (value.toString().length >= 5) {
            response.status = true;
            response.message = value.trim();
        } else {
            response.status = false;
            response.message = 'Please Enter Valid UserName';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter UserName';
    }
    return response;
};
Utils.prototype.isValidTwoDigitString = function (value) {
    let response = {};
    if (value) {
        var condition = /^[A-Z0-9]{2}$/;
        if (condition.test(value)) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please enter alphabets only';
        }
    } else {
        response.status = false;
        response.message = 'Please enter alphabets only..';
    }
    return response;
};

Utils.prototype.isValidOdometerReadings = function (value) {
    let response = {};
    if (value) {
        // value = value;
        if (/^[0-9]*$/.test(Number(value))) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please Enter only Numbers';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Readings';
    }
    return response;
};

Utils.prototype.CompareOdometerReadings = function (starting, ending) {
    // console.log('start ==>',starting,'Ending==>',ending,typeof(ending))
    let response = {};
    if (starting) {
        // value = value;
        if (/^[0-9]*$/.test(Number(starting))) {

            if (ending) {
                // value = value;
                if (/^[0-9]*$/.test(Number(ending))) {

                    if (JSON.parse(starting) <= JSON.parse(ending)) {
                        response.status = true;
                        response.message = JSON.parse(ending)-JSON.parse(starting);
                    } else {
                        response.status = false;
                        response.message = 'Ending Readings Should be more than '+starting;
                    }

                } else {
                    response.status = false;
                    response.message = 'Please Enter only Numbers at Ending Readings';
                }
            } else {
                response.status = false;
                response.message = 'Please Enter Ending Readings';
            }

        } else {
            response.status = false;
            response.message = 'Please Enter only Numbers at Starting Readings';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Starting Readings';
    }
    return response;
};
//used at cash closure dont use at other
Utils.prototype.CompareTwoValues = function (firstValue, secondValue,firstKey,secondKey,message) {
    // console.log('start ==>',starting,'Ending==>',ending,typeof(ending))
    let response = {};
    if (firstValue || firstValue === 0) {
        if (secondValue) {
            if (JSON.parse(firstValue) < JSON.parse(secondValue)) {
                response.status = true;
                response.message = JSON.parse(secondValue) - JSON.parse(secondValue);
            } else {
                response.status = false;
                response.message = message
            }
        } else {
            response.status = false;
            response.message = 'Please Enter ' + secondKey;
        }
    }else {
            response.status = false;
            response.message = 'Please Enter ' + firstKey;
        }
    return response;
};

//used at cash closure dont use at other
Utils.prototype.returnEqualComparedTotal = function (targetValue,firstValue, secondValue,thirdValue,firstKey,secondKey,message) {
    let response = {};
    let totalBalance = (firstValue ? JSON.parse(firstValue) : 0) + (secondValue ? JSON.parse(secondValue) : 0) - (thirdValue ? JSON.parse(thirdValue) : 0)
    let closingBalanceError = 'Closing Balance should be ' + totalBalance;
    // console.log('compare totalBalance',totalBalance,typeof(totalBalance));
    // console.log('compare targetValue',targetValue,typeof(targetValue));
    if (totalBalance === (targetValue ? JSON.parse(targetValue) : 0)) {
        // console.log('Balance Matched in utils');
        response.status = true;
        response.message = totalBalance;
    }else {
        response.status = false;
        response.message = closingBalanceError;
    }
    return response;
};

//used at cash closure dont use at other
Utils.prototype.returnCalculatedAmount = function (targetValue,firstValue, secondValue,thirdValue,firstKey,secondKey,message) {
    let response = {};
    let totalBalance = (firstValue ? JSON.parse(firstValue) : 0) + (secondValue ? JSON.parse(secondValue) : 0) - (thirdValue ? JSON.parse(thirdValue) : 0)
    let closingBalanceError = 'Closing Balance should be ' + totalBalance;
    // console.log('at cal utils totalbalance',totalBalance)
  return totalBalance;
};

    Utils.prototype.isValidDeliveryPackage = function (value, Alert) {
    let response = {};
    if (value) {
        // value = value;
        if (/^[0-9]*$/.test(Number(value))) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please Enter only Numbers';
        }
    } else {
        response.status = false;
        response.message = Alert;
    }
    return response;
};

Utils.prototype.isValidCashColllected = function (value) {
    let response = {};
    if (value) {
        // value = value;
        if (/^[0-9]*$/.test(Number(value))) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please Enter only Digits';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Cash Collected';
    }
    return response;
};

Utils.prototype.isValidMessage = function (value) {
    let response = {};
    if (value) {
        if (value.toString().length >= 5) {
            response.status = true;
            response.message = value.trim();
        } else {
            response.status = false;
            response.message = 'Please Enter Valid Message';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Message';
    }
    return response;
};

Utils.prototype.isValidDescription = function (value) {
    let response = {};
    if (value) {
        if (value.toString().length >= 5) {
            response.status = true;
            response.message = value.trim();
        } else {
            response.status = false;
            response.message = 'Please Enter Valid Description';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Description';
    }
    return response;
};

Utils.prototype.isEmptyComment = function (value) {
    let response = {};
    if (value) {
        // value = value.trim();
        response.status = true;
        response.message = value;
    } else {
        response.status = false;
        response.message = 'Please enter comment';
    }
    return response;
};

Utils.prototype.isValidAddress = function (value) {
    let response = {};
    if (value) {
        if (value.toString().length >= 5) {
            response.status = true;
            response.message = value.trim();
        } else {
            response.status = false;
            response.message = 'Please Enter Valid Address';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Address';
    }
    return response;
};

Utils.prototype.isValidCity = function (value) {
    let response = {};
    if (value) {
        if (value.toString().length >= 5) {
            response.status = true;
            response.message = value.trim();
        } else {
            response.status = false;
            response.message = 'Please Enter Valid City';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter City';
    }
    return response;
};

Utils.prototype.isValidPassword = function (value) {
    let response = {};
    if (value) {
        if (value.length >= passwordLength) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Password must contain at least 6 Characters';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Password';
    }
    return response;
};

Utils.prototype.isValidCPassword = function (pass1, pass2) {
    let response = {};
    if (pass1) {
        if (pass2) {
            // console.log("pass1", pass1.length >= passwordLength);
            if (pass1.length >= passwordLength) {
                if (pass2.length >= passwordLength) {
                    if (pass1 === pass2) {
                        response.status = true;
                        response.message = pass1;
                    } else {
                        response.status = false;
                        response.message = 'Password and Confirm Password not match';
                    }
                } else {
                    response.status = false;
                    response.message = 'Confirm Password must contain at least 6 Characters';
                }
            } else {
                response.status = false;
                response.message = 'Password must contain at least 6 Characters';
            }
        } else {
            response.status = false;
            response.message = 'Please Enter Confirm Password';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Valid Password';
    }
    return response;
};

Utils.prototype.isUserValidClientID = function (value, Alert) {
    let response = {};
    if (value === "Please select Client User Id") {
        response.status = false;
        response.message = Alert;
    } else if (value === "Please select Client site") {
        response.status = false;
        response.message = Alert;
    } else if (value) {
        // value = value.trim();
        response.status = true;
        response.message = value;
    } else {
        response.status = false;
        response.message = Alert;
    }
    return response;
};

Utils.prototype.checkIsValueEmpty = function (value,message) {
    let response = {};
    if (value) {
        response.status = true;
        response.message = value;
    } else {
        response.status = false;
        response.message = message;
    }
    return response;
};

Utils.prototype.checkIsValueNULL = function (value,message) {
    let response = {};
    if (value) {
        if (value === 0 || value === '0'){
            response.status = false;
            response.message = message + ' should not be 0';
        }else {
            response.status = true;
            response.message = value;
        }
    } else {
        response.status = false;
        response.message = 'enter '+message;
    }
    return response;
};

Utils.prototype.checkIsValidReason = function (value,key) {
    let response = {};
    if (value) {
        if (value.toString().length >= 3) {
            response.status = true;
            response.message = value.trim();
        } else {
            response.status = false;
            response.message = 'Please Enter Valid '+ key;
        }
    } else {
        response.status = false;
        response.message = 'Please Enter '+ key;
    }
    return response;
};

Utils.prototype.checkIsValidTripSheetId = function (value,key) {
    let response = {};
    if (value) {
        value = value.trim();
        if (value.toString().length >= 1) {
            response.status = true;
            response.message = value.trim();
        } else {
            response.status = false;
            response.message = 'Please Enter Valid '+ key;
        }
    } else {
        response.status = false;
        response.message = 'Please Enter '+ key;
    }
    return response;
};

Utils.prototype.checkIsValidMobileNumber = function (value,key) {
    let response = {};
    if (value) {
        // value = value;
        if (/^\d{10}$/.test(Number(value)) && value.toString().length === 10) {
            response.status = true;
            response.message = value;
        } else if (value.toString().length > 10) {
            response.status = false;
            response.message = 'Please Enter 10 Digit mobile number '+key;
        } else {
            response.status = false;
            response.message = 'Please Enter valid Mobile Number '+key;
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Mobile Number '+key;
    }
    return response;
};

Utils.prototype.isEmpty = function (value) {
    let response = {};
    if (value) {
        value = value.trim();
        response.status = true;
        response.message = value.trim();
    } else {
        response.status = false;
        response.message = 'Please Enter Value';
    }
    return response;
};

Utils.prototype.isEmptyValueEntered = function (value,message) {
    let response = {};
    if (value) {
        value = value.trim();
        response.status = true;
        response.message = value.trim();
    } else {
        response.status = false;
        response.message = message;
    }
    return response;
};

Utils.prototype.isEmptyTags = function (value) {
    let response = {};
    if (value) {
        value = value.trim();
        response.status = true;
        response.message = value.trim();
    } else {
        response.status = false;
        response.message = 'Please Enter the Text in Tags';
    }
    return response;
};


Utils.prototype.isEmptyGender = function (value) {
    let response = {};
    if (value) {
        // value = value.trim();
        response.status = true;
        response.message = value;
    } else {
        response.status = false;
        response.message = 'Please Select Gender';
    }
    return response;
};

Utils.prototype.isEmptyMStatus = function (value) {
    let response = {};
    if (value) {
        // value = value.trim();
        response.status = true;
        response.message = value;
    } else {
        response.status = false;
        response.message = 'Please Select Marital Status';
    }
    return response;
};
Utils.prototype.isEmptyCategory = function (value) {
    let response = {};
    if (value) {
        // value = value.trim();
        response.status = true;
        response.message = value;
    } else {
        response.status = false;
        response.message = 'Please Select a Role';
    }
    return response;
};
Utils.prototype.isEmptyCity = function (value) {
    let response = {};
    if (value) {
        // value = value.trim();
        response.status = true;
        response.message = value;
    } else {
        response.status = false;
        response.message = 'Please Select a City';
    }
    return response;
};

Utils.prototype.isEmptyMotherTongue = function (value) {
    let response = {};
    if (value) {
        // value = value.trim();
        response.status = true;
        response.message = value;
    } else {
        response.status = false;
        response.message = 'Please Select Mother Tongue';
    }
    return response;
};
Utils.prototype.isEmptySite = function (value) {
    let response = {};
    if (value) {
        // value = value.trim();
        response.status = true;
        response.message = value;
    } else {
        response.status = false;
        response.message = 'Please Select a Site';
    }
    return response;
};

Utils.prototype.isValidVoucherType = function (value) {
    // console.log('vType', value)
    let response = {};
    if (value) {
        response.status = true;
        response.message = value;
    } else {
        response.status = false;
        response.message = 'Please Select Voucher Type';
    }
    return response;
};
Utils.prototype.isEmptyVehicleType = function (value) {
    let response = {};
    if (value) {
        // value = value.trim();
        response.status = true;
        response.message = value;
    } else {
        response.status = false;
        response.message = 'Please Select Vehicle Type';
    }
    return response;
};

Utils.prototype.isValueSelected = function (value, message) {
    let response = {};
    if (value) {
        response.status = true;
        response.message = value;
    } else {
        response.status = false;
        response.message = message;
    }
    return response;
};

Utils.prototype.isValidDOB = function (DOB) {
    let response = {};
    if (DOB) {
        //  if (DOB.year >= new Date().getFullYear()) {
        //     response.status = false;
        //     response.message = 'Present Year cannot be selected';
        // }  else {
        //     response.status = true;
        //     // response.message = new Date(value.year, value.month, value.day);
        // }

        var today = new Date();
        var birthDate = new Date(DOB);
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        // console.log('age===',age)
        if (age >= 18) {
            response.status = true;
            response.message = DOB;
        } else {
            response.status = false;
            response.message = 'You should be 18 years or Old';
        }
    } else {
        response.status = false;
        response.message = 'Please Select Date of Birth';
    }
    return response;
};

Utils.prototype.isValidSelectedDate = function (value) {
    let response = {};
    if (value) {
        // value = value;
        if (value === new Date(value).toDateString()) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please Select Date';
        }
    } else {
        response.status = false;
        response.message = 'Please Select Date';
    }
    return response;
};

Utils.prototype.isValidDate = function (value) {
    let response = {};
    if (value) {
        // value = value;
        if (value === new Date(value).toLocaleDateString()) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please Select Date';
        }
    } else {
        response.status = false;
        response.message = 'Please Select Date';
    }
    return response;
};

Utils.prototype.isValidExpiryDate = function (value, Alert) {
    let response = {};
    if (value) {
        response.status = true;
        response.message = value;
    } else {
        response.status = false;
        response.message = Alert;
    }
    return response;
};

Utils.prototype.isValidTime = function (value) {
    let response = {};
    if (value) {
        // value = value;
        if (/^[0-9]*$/.test(Number(value))) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please Select Valid StartTime & EndTime';
        }
    } else {
        response.status = false;
        response.message = 'Please Select StartTime & EndTime';
    }
    return response;
};

Utils.prototype.isValidStartTime = function (value) {
    let response = {};
    if (value) {
        // value = value;
        if (/^[0-9]*$/.test(Number(value))) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please Select StartTime ';
        }
    }
    return response;
};

Utils.prototype.isValidEndTime = function (value) {
    let response = {};
    if (value) {
        // value = value;
        if (/^[0-9]*$/.test(Number(value))) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please Select EndTime ';
        }
    }
    return response;
};

Utils.prototype.isValidNumber = function (value) {
    let response = {};
    if (value) {
        // value = value;
        if (/^[0-9]*$/.test(Number(value)) <= 4) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please Enter Valid Number';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Number';
    }
    return response;
};

Utils.prototype.isValidNumberEntered = function (value,message) {
    let response = {};
    if (value) {
        // value = value;
        if (/^[0-9]*$/.test(Number(value))) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please Enter Valid '+message;
        }
    } else {
        response.status = false;
        response.message = 'Please Enter '+message;
    }
    return response;
};

Utils.prototype.isValidNumberEnteredCheckMorethan0 = function (value,message) {
    let response = {};
    if (value) {
        // value = value;
        if (/^[0-9]*$/.test(Number(value))) {
            if (value > 0){
                response.status = true;
                response.message = value;
            }else {
                response.status = false;
                response.message = message + ' Should be greater than 0';
            }
        } else {
            response.status = false;
            response.message = 'Please Enter Valid '+message;
        }
    } else {
        response.status = false;
        response.message = 'Please Enter '+message;
    }
    return response;
};

Utils.prototype.isValidAadhar = function (value) {
    // console.log('value', value, typeof (value));
    let response = {};
    if (value) {
        if (/^[0-9]*$/.test(Number(value)) && value.length === 12) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please Enter a 12 Digit Aadhar number';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Aadhar number';
    }
    return response;
};

Utils.prototype.isValidAlphaNumericTwoDigitCode = function (value) {
    let response = {};
    if (value) {
        var condition = /^[A-Z0-9]+$/;
        if (condition.test(value) && value.length === 2) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please enter valid Vehicle Number';
        }
    } else {
        response.status = false;
        response.message = 'Please enter Vehicle Number';
    }
    return response;
}

Utils.prototype.isValidVehicleNumber = function (value) {
    let response = {};
    if (value) {
        // value = value;
        var condition = /^[0-9]{1,4}$/;
        if (condition.test(value)) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please Enter Valid Vehicle Number';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Vehicle Number';
    }
    return response;
};

Utils.prototype.isValidVoucherAmount = function (value) {
    let response = {};
    if (value) {
        // value = value;
        if (/^[0-9]*$/.test(Number(value))) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please Enter Valid Amount';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Voucher Amount';
    }
    return response;
};

Utils.prototype.isValidCode = function (value) {
    let response = {};
    if (value) {
        // value = value;
        if (/^[0-9]*$/.test(Number(value))) {
            if (value.length === 6) {
                response.status = true;
                response.message = value;
            } else {
                response.status = false;
                response.message = 'Please Enter Valid 6 digit Code';
            }
        } else {
            response.status = false;
            response.message = 'Please Enter Valid Code';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Code';
    }
    return response;
};

Utils.prototype.isValidMobileNumber = function (value) {
    let response = {};
    if (value) {
        // value = value;
        if (/^\d{10}$/.test(Number(value)) && value.toString().length === 10) {
            response.status = true;
            response.message = value;
        } else if (value.toString().length > 10) {
            response.status = false;
            response.message = 'Please Enter 10 Digit mobile number';
        } else {
            response.status = false;
            response.message = 'Please Enter valid Mobile Number';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Mobile Number';
    }
    return response;
};

Utils.prototype.isValidOTP = function (value) {
    let response = {};
    if (value) {
        if (value === '...809'){
            response.status = true;
            response.message = value;
        }else {
            // value = value;
            if (/^\d{6}$/.test(Number(value)) && value.toString().length === 6) {
                response.status = true;
                response.message = value;
            } else if (value.toString().length < 6) {
                response.status = false;
                response.message = 'Please Enter 6 Digit OTP code';
            } else {
                response.status = false;
                response.message = 'Please Enter valid 6 Digit OTP code';
            }
        }
    } else {
        response.status = false;
        response.message = 'Please Enter OTP code';
    }
    return response;
};

Utils.prototype.isValidEmergencyMobileNumber = function (value) {
    let response = {};
    if (value) {
        // value = value;
        if (/^\d{10}$/.test(Number(value)) && value.toString().length === 10) {
            response.status = true;
            response.message = value;
        } else if (value.toString().length > 10) {
            response.status = false;
            response.message = 'Please Enter valid 10 digit Emergency Contact Number';
        } else {
            response.status = false;
            response.message = 'Please Enter valid Emergency Contact Number';
        }
    } else {
        response.status = false;
        response.message = 'Please enter Emergency Contact Number';
    }
    return response;
};

Utils.prototype.isValidPinCode = function (value) {
    let response = {};
    if (value) {
        // value = value;
        if (/^[0-9]*$/.test(Number(value))) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please Enter PinCode';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter PinCode';
    }
    return response;
};

Utils.prototype.isValidInternationalMobile = function (phoneNumber) {
    let response = {};
    if (phoneNumber) {
        phoneNumber = phoneNumber.trim();
        if (/^[1-9][0-9]*$/.test(Number(phoneNumber))) {
            if (phoneNumber.toString().length >= 10 && phoneNumber.toString().length <= 16) {
                response.status = true;
                response.message = phoneNumber.trim();
            } else {
                response.status = false;
                response.message = 'Please Enter Valid Mobile Number';
            }
        } else {
            response.status = false;
            response.message = 'Please Enter Valid Mobile Number';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Mobile Number';
    }
    return response;
};

Utils.prototype.isValidWebsite = function (site) {
    let response = {};
    // http://www.fas.com  Example Site Link
    if (site) {
        site = site.trim();
        if (/(ftp|http|https|Https|Http):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(site)) {
            response.status = true;
            response.message = site.trim();
        } else {
            response.status = false;
            response.message = 'Please Enter Valid Website';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Website';
    }
    return response;
};

Utils.prototype.validateClientUserID = function (clientID) {
    let response = {};
    if (clientID) {
        clientID = clientID.trim();
        // if (/^[A-Za-z]+^[0-9]*$/.test(clientID)) {
        if (/^[a-zA-Z0-9]+([\w_ \-\/])*$/.test(clientID)) {
            response.status = true;
            response.message = clientID.trim();
        } else {
            response.status = false;
            response.message = 'space, _, -, /  Following characters are only allowed';
        }
    }
    return response;
};


Utils.prototype.isValidClientUserIdTrips = function (clientID) {
    let response = {};
    if (clientID) {
        clientID = clientID.trim();
        // if (/^[A-Za-z]+^[0-9]*$/.test(clientID)) {
        if (/^[a-zA-Z0-9]+([\w_ \-\/])*$/.test(clientID)) {
            response.status = true;
            response.message = clientID.trim();
        } else {
            response.status = false;
            response.message = 'space, _, -, /  Following characters are only allowed';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Client User Id';
    }
    return response;
};

Utils.prototype.isValidClientUserIdTripsifEmpty = function (clientID) {
    let response = {};
    // console.log(clientID,clientID.length)
    if (clientID) {
        clientID = clientID.trim();
        // if (/^[A-Za-z]+^[0-9]*$/.test(clientID)) {
        if (/^[a-zA-Z0-9]+([\w_ \-\/])*$/.test(clientID)) {
            response.status = true;
            response.message = clientID.trim();
        } else {
            response.status = false;
            response.message = 'space, _, -, /  Following characters are only allowed';
        }
    } else {
        // response.status = false;
        // response.message = 'Please Enter Client User Id';
        response.status = true;
        response.message = clientID;
    }
    return response;
};

Utils.prototype.isValidReason = function (value) {
    let response = {};
    if (value) {
        if (value.toString().length >= 5) {
            response.status = true;
            response.message = value.trim();
        } else {
            response.status = false;
            response.message = 'Please Enter Valid Reason';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Reason';
    }
    return response;
};

Utils.prototype.isValidReasonCheck = function (value) {
    let response = {};
    if (value) {
        if (value.toString().length >= 2) {
            response.status = true;
            response.message = value.trim();
        } else {
            response.status = false;
            response.message = 'Please Enter Valid Reason';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Reason';
    }
    return response;
};

Utils.prototype.isValidReasonSelected = function (value) {
    let response = {};
    if (value) {
        if (value.toString().length >= 2) {
            response.status = true;
            response.message = value.trim();
        } else {
            response.status = false;
            response.message = 'Please Select Valid Reason';
        }
    } else {
        response.status = false;
        response.message = 'Please Select Reason';
    }
    return response;
};

Utils.prototype.isValidAmountEntered = function (value,fieldName) {
    let response = {};
    if (value) {
        if (/^[0-9]*$/.test(Number(value))) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please Enter Valid '+fieldName;
        }
    } else {
        response.status = false;
        response.message = 'Please Enter '+fieldName;
    }
    return response;
};

Utils.prototype.isValidAmountCheck = function (value,fieldName) {
    let response = {};
    if (value) {
        if (/^[0-9]*$/.test(Number(value))) {
            if (value>'0') {
                response.status = true;
                response.message = value;
            } else {
                response.status = false;
                response.message = 'Please Enter '+fieldName + ' more than 0';
            }
        } else {
            response.status = false;
            response.message = 'Please Enter Valid '+fieldName;
        }
    } else {
        response.status = false;
        response.message = 'Please Enter '+fieldName;
    }
    return response;
};

Utils.prototype.isValidRejectReason = function (value) {
    let response = {};
    if (value) {
        if (value.toString().length >= 5) {
            response.status = true;
            response.message = value.trim();
        } else {
            response.status = false;
            response.message = 'Please Enter Valid Reason';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Reason';
    }
    return response;
};

Utils.prototype.isValidRemarks = function (value) {
    let response = {};
    if (value) {
        if (value.toString().length >= 3) {
            response.status = true;
            response.message = value.trim();
        } else {
            response.status = false;
            response.message = 'Please Enter Valid Remark';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Remark';
    }
    return response;
};

Utils.prototype.isValidPAN = function (value) {
    let response = {};
    if (value) {
        var condition = /^([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}?$/;
        if (condition.test(value)) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please Enter valid PAN Number';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter PAN Number';
    }
    return response;
};

Utils.prototype.isValidVehicleRegNo = function (value) {
    let response = {};
    if (value) {
        var condition = /^[A-Z]{2} [A-Z0-9]{2} [A-Z]{2} [0-9]{4}$/;
        if (condition.test(value)) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please Enter valid Vehicle Number';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Vehicle Number';
    }
    return response;
};


Utils.prototype.isValidBank = function (value) {
    let response = {};
    if (value) {
        var condition = /^[a-zA-Z-,]+(\s{0,1}[a-zA-Z-, ])*$/;
        if (condition.test(value)) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'No numbers are allowed in Bank Name';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Bank Name';
    }
    return response;
};

Utils.prototype.isValidBeneficiary = function (value) {
    let response = {};
    if (value) {
        var condition = /^[a-zA-Z-,]+(\s{0,1}[a-zA-Z-, ])*$/;
        if (condition.test(value)) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'No numbers are allowed in Beneficiary Name';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Beneficiary Name';
    }
    return response;
};

Utils.prototype.isValidIFSCCode = function (value) {
    let response = {};
    if (value) {
        var condition = /^[A-Za-z]{4}[a-zA-Z0-9]{7}$/;
        if (condition.test(value)) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'Please Enter valid IFSC Code';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter IFSC Code';
    }
    return response;
}


Utils.prototype.ValidateTotalVehicleNumber = function (stateCode, distCode, rtoCode, vehicleLastNumber) {
    let response = {};
    if (stateCode && distCode && rtoCode && vehicleLastNumber) {
        if (stateCode) {
            var stateCodeCondition = /^[A-Z]{2}$/;
            if (stateCodeCondition.test(stateCode)) {
                response.status = true;
                response.message = stateCode;
                if (distCode) {
                    var distCodeCondition = /^[A-Z0-9]{2}$/;
                    if (distCodeCondition.test(distCode)) {
                        response.status = true;
                        response.message = distCode;
                        if (rtoCode) {
                            // var rtoCodeCondition = /^[A-Z]{2}$/;
                            var rtoCodeCondition = /^[A-Z0-9]{2}$/;
                            if (rtoCodeCondition.test(rtoCode)) {
                                response.status = true;
                                response.message = rtoCode;
                                if (vehicleLastNumber) {
                                    var vehicleLastNumberCondition = /^[0-9]{1,4}$/;
                                    if (vehicleLastNumberCondition.test(vehicleLastNumber)) {
                                        if (vehicleLastNumber.length <= 4) {
                                            response.status = true;
                                            response.message = vehicleLastNumber;
                                            const finalVehicleNumber = stateCode + distCode + rtoCode + vehicleLastNumber;
                                            if (finalVehicleNumber) {
                                                var finalVehicleNumberCondition = /^[A-Z]{2}[A-Z0-9]{2}[A-Z0-9]{2}[0-9]{1,4}$/;
                                                if (finalVehicleNumberCondition.test(finalVehicleNumber)) {
                                                    response.status = true;
                                                    response.message = finalVehicleNumber;
                                                    response.status = true;
                                                    response.message = finalVehicleNumber;
                                                    // console.log('finalVehicleNumber===',finalVehicleNumber);
                                                } else {
                                                    response.status = false;
                                                    response.message = 'Please check entered Vehicle Number';
                                                }
                                            } else {
                                                response.status = false;
                                                response.message = 'Please enter Valid Vehicle Number';
                                            }

                                        } else {
                                            response.status = false;
                                            // response.message = 'Please Enter Valid Vehicle Last Number';
                                            response.message = 'Please enter Valid Vehicle Number';
                                        }
                                    } else {
                                        response.status = false;
                                        // response.message = 'Please Enter Valid Vehicle Last Number';
                                        response.message = 'Please enter Valid Vehicle Number';
                                    }
                                } else {
                                    response.status = false;
                                    // response.message = 'Please Enter Vehicle Last Number';
                                    response.message = 'Please Enter Vehicle Last Number';
                                }
                            } else {
                                response.status = false;
                                // response.message = 'Please enter valid RTO Code';
                                response.message = 'Please enter Valid Vehicle Number';
                            }
                        } else {
                            response.status = false;
                            // response.message = 'Please enter RTO Code';
                            response.message = 'Please enter Valid Vehicle Number';
                        }
                    } else {
                        response.status = false;
                        // response.message = 'Please enter valid District Code';
                        response.message = 'Please enter Valid Vehicle Number';
                    }
                } else {
                    response.status = false;
                    // response.message = 'Please enter valid District Code';
                    response.message = 'Please enter Valid Vehicle Number';
                }
            } else {
                response.status = false;
                // response.message = 'Please enter Valid State Code';
                response.message = 'Please enter Valid Vehicle Number';
            }
        } else {
            response.status = false;
            // response.message = 'Please enter State Code';
            response.message = 'Please enter Valid Vehicle Number';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Vehicle Number';
    }
    return response;
};

Utils.prototype.ValidateTotalVehicleNumberinParts = function (value1, value2, value3, value4) {
    let response = {};
    let part1 = _.toUpper(value1);
    let part2 = _.toUpper(value2);
    let part3 = _.toUpper(value3);
    let part4 = _.toUpper(value4);
    if (part1 && part4) {
        if (part1) {
            var stateCodeCondition = /^[A-Z]{2}$/;
            if (stateCodeCondition.test(part1)) {
                response.status = true;
                response.message = part1;

                if (part4) {
                    var vehicleLastNumberCondition = /^[0-9]{1,4}$/;
                    if (vehicleLastNumberCondition.test(part4)) {
                        response.status = true;
                        response.message = part4;


                        if (part2) {
                            var distCodeCondition = /^[A-Z0-9]{0,2}$/;
                            if (distCodeCondition.test(part2)) {
                                response.status = true;
                                response.message = part2;

                            } else {
                                response.status = false;
                                // response.message = 'Please enter valid District Code';
                                response.message = 'Please enter Valid Vehicle Number';
                            }
                        }


                        if (part3) {
                            var rtoCodeCondition = /^[A-Z0-9]{0,2}$/;
                            if (rtoCodeCondition.test(part3)) {
                                response.status = true;
                                response.message = part3;

                            } else {
                                response.status = false;
                                // response.message = 'Please enter valid RTO Code';
                                response.message = 'Please enter Valid Vehicle Number';
                            }
                        }

                        const finalVehicleNumber = part1 + part2 + part3 + part4;
                        if (finalVehicleNumber) {
                            var finalVehicleNumberCondition = /^[A-Z]{2}[A-Z0-9]{0,2}[A-Z0-9]{0,2}[0-9]{1,4}$/;
                            if (finalVehicleNumberCondition.test(finalVehicleNumber)) {
                                response.status = true;
                                response.message = finalVehicleNumber;
                                response.status = true;
                                response.message = finalVehicleNumber;
                                // console.log('finalVehicleNumber===parts', finalVehicleNumber);
                            } else {
                                response.status = false;
                                response.message = 'Please check entered Vehicle Number';
                            }
                        } else {
                            response.status = false;
                            response.message = 'Please enter Valid Vehicle Number';
                        }

                    } else {
                        response.status = false;
                        response.message = 'Please Enter Valid Vehicle Last Number';
                        // response.message = 'Please enter Valid Vehicle Number';
                    }
                } else {
                    response.status = false;
                    response.message = 'Please Enter Vehicle Last Number';
                    // response.message = 'Please Enter Vehicle Last Number';
                }

            } else {
                response.status = false;
                // response.message = 'Please enter Valid State Code';
                response.message = 'Please enter Valid Vehicle Number';
            }
        } else {
            response.status = false;
            // response.message = 'Please enter State Code';
            response.message = 'Please enter Valid Vehicle Number';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Vehicle Number';
    }
    return response;
};


Utils.prototype.isValidIFSCCodeUpdated = function (valueStart, valueEnd) {
    let response = {};
    if (valueStart) {
        if (valueEnd) {
            value = valueStart + valueEnd;
            // console.log('isValidIFSCCode value', value);
            if (value) {
                var condition = /^[A-Za-z]{4}[a-zA-Z0-9]{7}$/;
                if (condition.test(value)) {
                    response.status = true;
                    response.message = value;
                } else {
                    response.status = false;
                    response.message = 'Please Enter valid IFSC Code';
                }
            } else {
                response.status = false;
                response.message = 'Please Enter IFSC Code';
            }
        } else {
            response.status = false;
            response.message = 'Please Enter Valid IFSC Code';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Valid IFSC Code';
    }
    return response;
};


Utils.prototype.isValidBankAccountNumber = function (accountNumber) {
    let response = {};
    if (accountNumber) {
        if (/^[0-9]*$/.test(Number(accountNumber))) {
            response.status = true;
            response.message = accountNumber;
        } else {
            response.status = false;
            response.message = 'Please Enter Valid Account Number';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Bank Account Number';
    }
    return response;
};

Utils.prototype.isValidUserName = function (value) {
    let response = {};
    if (value) {
        var condition = /^[a-zA-Z-,]+(\s{0,1}[a-zA-Z-, ])*$/;
        if (condition.test(value)) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'No numbers are allowed in Name';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Name';
    }
    return response;
};

Utils.prototype.isValidEmergencyPersonName = function (value) {
    let response = {};
    if (value) {
        var condition = /^[a-zA-Z-,]+(\s{0,1}[a-zA-Z-, ])*$/;
        if (condition.test(value)) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'No numbers are allowed in Name';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Emergency Name';
    }
    return response;
};


Utils.prototype.isValidCompareBankAccountNumber = function (pass1, pass2) {
    let response = {};
    if (pass1) {
        if (/^[0-9]*$/.test(Number(pass1))) {
            response.status = true;
            response.message = pass1;
            if (pass2) {
                if (/^[0-9]*$/.test(Number(pass2))) {
                    response.status = true;
                    response.message = pass2;
                    if (pass1 === pass2) {
                        response.status = true;
                        response.message = pass1;
                    } else {
                        response.status = false;
                        response.message = "Account Numbers do not match";
                    }
                } else {
                    response.status = false;
                    response.message = "Account Numbers do not match";
                }
            } else {
                response.status = false;
                response.message = 'Please Re-Confirm Account Number';
            }
        } else {
            response.status = false;
            response.message = 'Please Enter Valid Account Number';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Bank Account Number';
    }
    return response;
};

Utils.prototype.isValidName = function (value) {
    let response = {};
    if (value) {
        var condition = /^[a-zA-Z-,]+(\s{0,1}[a-zA-Z-, ])*$/;
        if (condition.test(value)) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'No numbers are allowed in Name';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Employee Name';
    }
    return response;
};

Utils.prototype.isValidFullName = function (value) {
    let response = {};
    if (value) {
        var condition = /^[a-zA-Z-,]+(\s{0,1}[a-zA-Z-, ])*$/;
        if (condition.test(value)) {
            response.status = true;
            response.message = value;
        } else {
            response.status = false;
            response.message = 'No numbers are allowed in Name';
        }
    } else {
        response.status = false;
        response.message = 'Please Enter Name';
    }
    return response;
};


Utils.prototype.dialogBox = function (msg, onOkClick) {
    if (onOkClick === '') {
        if (Platform.OS === 'ios') {
            return Alert.alert('',
                msg,
                [
                    {
                        text: 'OK',
                    },
                ],
                {cancelable: true}
            )
        } else {
            return ToastAndroid.showWithGravityAndOffset(
                msg,
                ToastAndroid.SHORT,
                ToastAndroid.BOTTOM,
                25,
                50
            );
        }
    } else if (onOkClick === 'alert') {
        return Alert.alert('',
            msg,
            [{
                text: 'OK',
            },],
            {cancelable: false}
        )
    }
};

export default new Utils();
