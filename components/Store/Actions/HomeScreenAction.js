

export const ACTIONHOMESCREEN="ACTIONHOMESCREEN"

const getActionHomeScreen=(data)=>{
    return{
        type:ACTIONHOMESCREEN,
        payload:data
    }
}

export const ActionHomeScreen=(data)=>{
return dispatch=>{
    dispatch(getActionHomeScreen(data))
}
}
