

export const ACTIONUSERLOGHISTORY="ACTIONUSERLOGHISTORY"

const getActionUserLogHistory=(data)=>{
    return{
        type:ACTIONUSERLOGHISTORY,
        payload:data
    }
}

export const ActionUserLogHistory=(data)=>{
return dispatch=>{
    dispatch(getActionUserLogHistory(data))
}
}
